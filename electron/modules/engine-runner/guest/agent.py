#!/usr/bin/env python3
"""
AlgoVault guest agent.

Runs inside the sandbox VM (started by /sbin/algovault-init under tini).
Talks to the host over a virtio-serial port named "algovault.agent" using
newline-delimited JSON. The VM has no network device; this port is the only
way in or out.

Requests (host -> guest), one JSON object per line:
  {"type": "ping", "id": "..."}
  {"type": "run",  "id": "...", "lang": "python|javascript|typescript|c|cpp",
   "code": "...", "tests": [{"stdin": "..."}, ...],      # or "stdin": "..."
   "timeoutMs": 5000, "compileTimeoutMs": 20000, "memoryMb": 256}
  {"type": "shutdown", "id": "..."}

Responses (guest -> host):
  {"type": "pong", "id": "...", "versions": {...}}
  {"type": "result", "id": "...", "compile": {...} | null, "runs": [{...}, ...]}
  {"type": "error", "id": "...", "message": "..."}
"""

import glob
import json
import os
import pwd
import resource
import shutil
import signal
import subprocess
import sys
import threading
import time

PORT_NAME = "algovault.agent"
RUN_ROOT = "/tmp/runs"
RUNNER_USER = "runner"

MAX_OUTPUT_BYTES = 1 << 20          # per stream, per run
MAX_CODE_BYTES = 1 << 20
MAX_TESTS = 200
DEFAULT_TIMEOUT_MS = 5_000
MAX_TIMEOUT_MS = 30_000
DEFAULT_COMPILE_TIMEOUT_MS = 20_000
DEFAULT_MEMORY_MB = 256
MAX_MEMORY_MB = 768
MAX_PROCS = 64                      # RLIMIT_NPROC for the runner user

NODE_FLAGS = ["--disable-warning=ExperimentalWarning", "--stack-size=65500"]

# lang -> (source file, compile argv or None, run argv, limit address space?)
LANGS = {
    "python": ("main.py", None, ["python3", "-I", "-B", "main.py"], True),
    "javascript": ("main.js", None, ["node", *NODE_FLAGS, "main.js"], False),
    "typescript": ("main.ts", None,
                   ["node", *NODE_FLAGS, "--experimental-transform-types", "main.ts"], False),
    "c": ("main.c", ["gcc", "-O2", "-std=gnu17", "-pipe", "-o", "main", "main.c", "-lm"],
          ["./main"], True),
    "cpp": ("main.cpp", ["g++", "-O2", "-std=gnu++20", "-pipe", "-o", "main", "main.cpp"],
            ["./main"], True),
}
LANG_ALIASES = {"js": "javascript", "ts": "typescript", "py": "python", "c++": "cpp"}

RUNNER = pwd.getpwnam(RUNNER_USER)
RUN_ENV = {
    "PATH": "/usr/local/bin:/usr/bin:/bin",
    "HOME": "/tmp",
    "LANG": "C.UTF-8",
    "PYTHONDONTWRITEBYTECODE": "1",
    "PYTHONUNBUFFERED": "1",
    "NODE_DISABLE_COLORS": "1",
}


def log(*args):
    print("[agent]", *args, file=sys.stderr, flush=True)


# --------------------------------------------------------------------------- #
# Process execution
# --------------------------------------------------------------------------- #

def kill_all_runner_processes():
    """Kill every process owned by the runner user (incl. daemonized leftovers)."""
    pid = os.fork()
    if pid == 0:
        try:
            os.setgid(RUNNER.pw_gid)
            os.setuid(RUNNER.pw_uid)
            os.kill(-1, signal.SIGKILL)   # all processes we may signal, except ourselves
        except Exception:
            pass
        os._exit(0)
    os.waitpid(pid, 0)


def read_capped(path):
    try:
        with open(path, "rb") as f:
            data = f.read(MAX_OUTPUT_BYTES + 1)
    except FileNotFoundError:
        return "", False
    truncated = len(data) > MAX_OUTPUT_BYTES
    return data[:MAX_OUTPUT_BYTES].decode("utf-8", errors="replace"), truncated


def execute(argv, cwd, stdin_text, timeout_ms, memory_mb, limit_as, extra_env=None):
    """Run argv as the unprivileged runner user with resource limits."""
    in_path = os.path.join(cwd, ".stdin")
    out_path = os.path.join(cwd, ".stdout")
    err_path = os.path.join(cwd, ".stderr")
    with open(in_path, "wb") as f:
        f.write((stdin_text or "").encode())

    cpu_seconds = max(1, (timeout_ms + 999) // 1000)
    mem_bytes = memory_mb * 1024 * 1024

    def limits():
        resource.setrlimit(resource.RLIMIT_CPU, (cpu_seconds, cpu_seconds + 1))
        resource.setrlimit(resource.RLIMIT_FSIZE, (MAX_OUTPUT_BYTES * 4, MAX_OUTPUT_BYTES * 4))
        resource.setrlimit(resource.RLIMIT_NPROC, (MAX_PROCS, MAX_PROCS))
        resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
        resource.setrlimit(resource.RLIMIT_NOFILE, (256, 256))
        if limit_as:
            resource.setrlimit(resource.RLIMIT_AS, (mem_bytes, mem_bytes))
        # 64 MB stack for deep recursion (common in algorithm problems)
        stack = min(64 * 1024 * 1024, mem_bytes)
        resource.setrlimit(resource.RLIMIT_STACK, (stack, stack))

    env = dict(RUN_ENV)
    if extra_env:
        env.update(extra_env)

    with open(in_path, "rb") as fin, open(out_path, "wb") as fout, open(err_path, "wb") as ferr:
        start = time.monotonic()
        try:
            proc = subprocess.Popen(
                argv, cwd=cwd, env=env, stdin=fin, stdout=fout, stderr=ferr,
                user=RUNNER.pw_uid, group=RUNNER.pw_gid, extra_groups=[],
                start_new_session=True, preexec_fn=limits, close_fds=True,
            )
        except OSError as e:
            return {"exitCode": None, "signal": None, "timedOut": False,
                    "stdout": "", "stderr": f"failed to start: {e}", "timeMs": 0,
                    "cpuMs": 0, "memoryKb": 0, "outputTruncated": False}

        timed_out = threading.Event()

        def on_timeout():
            timed_out.set()
            try:
                os.killpg(proc.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass

        timer = threading.Timer(timeout_ms / 1000, on_timeout)
        timer.start()
        try:
            _, status, usage = os.wait4(proc.pid, 0)
        finally:
            timer.cancel()
        elapsed_ms = int((time.monotonic() - start) * 1000)
        proc.returncode = 0  # already reaped; keep Popen from waiting again

    kill_all_runner_processes()

    stdout, t1 = read_capped(out_path)
    stderr, t2 = read_capped(err_path)

    exit_code = os.WEXITSTATUS(status) if os.WIFEXITED(status) else None
    sig = None
    if os.WIFSIGNALED(status):
        try:
            sig = signal.Signals(os.WTERMSIG(status)).name
        except ValueError:
            sig = str(os.WTERMSIG(status))

    return {
        "exitCode": exit_code,
        "signal": sig,
        "timedOut": timed_out.is_set() or sig == "SIGXCPU",
        "stdout": stdout,
        "stderr": stderr,
        "timeMs": elapsed_ms,
        "cpuMs": int((usage.ru_utime + usage.ru_stime) * 1000),
        "memoryKb": usage.ru_maxrss,
        "outputTruncated": t1 or t2 or sig == "SIGXFSZ",
    }


_run_counter = 0


def handle_run(req):
    global _run_counter
    lang = LANG_ALIASES.get(req.get("lang"), req.get("lang"))
    if lang not in LANGS:
        raise ValueError(f"unsupported language: {req.get('lang')!r}")
    code = req.get("code")
    if not isinstance(code, str) or len(code.encode()) > MAX_CODE_BYTES:
        raise ValueError("code must be a string under 1 MB")

    tests = req.get("tests")
    if tests is None:
        tests = [{"stdin": req.get("stdin", "")}]
    if not isinstance(tests, list) or not tests or len(tests) > MAX_TESTS:
        raise ValueError(f"tests must be a non-empty list (max {MAX_TESTS})")

    timeout_ms = min(int(req.get("timeoutMs") or DEFAULT_TIMEOUT_MS), MAX_TIMEOUT_MS)
    compile_timeout_ms = min(int(req.get("compileTimeoutMs") or DEFAULT_COMPILE_TIMEOUT_MS), 60_000)
    memory_mb = min(int(req.get("memoryMb") or DEFAULT_MEMORY_MB), MAX_MEMORY_MB)

    source, compile_argv, run_argv, limit_as = LANGS[lang]
    if lang in ("javascript", "typescript"):
        run_argv = [run_argv[0], f"--max-old-space-size={memory_mb}", *run_argv[1:]]

    _run_counter += 1
    cwd = os.path.join(RUN_ROOT, str(_run_counter))
    os.makedirs(cwd)
    try:
        with open(os.path.join(cwd, source), "w") as f:
            f.write(code)
        os.chown(cwd, RUNNER.pw_uid, RUNNER.pw_gid)
        os.chmod(cwd, 0o700)

        compile_result = None
        if compile_argv:
            # Compilers need far more address space than the program itself.
            compile_result = execute(compile_argv, cwd, "", compile_timeout_ms, 1024, False)
            if compile_result["exitCode"] != 0:
                return {"compile": compile_result, "runs": []}

        runs = [execute(run_argv, cwd, (t or {}).get("stdin", ""), timeout_ms, memory_mb, limit_as)
                for t in tests]
        return {"compile": compile_result, "runs": runs}
    finally:
        kill_all_runner_processes()
        shutil.rmtree(cwd, ignore_errors=True)


def versions():
    out = {}
    for name, argv in {"node": ["node", "--version"], "python": ["python3", "--version"],
                       "gcc": ["gcc", "-dumpfullversion"]}.items():
        try:
            out[name] = subprocess.run(argv, capture_output=True, text=True,
                                       timeout=5).stdout.strip()
        except Exception as e:
            out[name] = f"unavailable: {e}"
    out["kernel"] = os.uname().release
    return out


_versions_cache = None


def handle(req):
    global _versions_cache
    rtype, rid = req.get("type"), req.get("id")
    if rtype == "ping":
        if _versions_cache is None:
            _versions_cache = versions()
        return {"type": "pong", "id": rid, "versions": _versions_cache}
    if rtype == "run":
        return {"type": "result", "id": rid, **handle_run(req)}
    if rtype == "shutdown":
        send({"type": "bye", "id": rid})
        os.sync()
        os.system("poweroff -f")
        return None
    raise ValueError(f"unknown request type: {rtype!r}")


# --------------------------------------------------------------------------- #
# Transport (virtio-serial)
# --------------------------------------------------------------------------- #

_port_fd = None


def find_port():
    for p in glob.glob("/sys/class/virtio-ports/*"):
        try:
            with open(os.path.join(p, "name")) as f:
                if f.read().strip() == PORT_NAME:
                    return "/dev/" + os.path.basename(p)
        except OSError:
            pass
    return None


def send(msg):
    data = (json.dumps(msg, separators=(",", ":")) + "\n").encode()
    view = memoryview(data)
    while view:
        try:
            n = os.write(_port_fd, view)
            view = view[n:]
        except BlockingIOError:
            time.sleep(0.005)
        except OSError as e:
            log("write failed (host disconnected?):", e)
            return


def main():
    global _port_fd
    os.makedirs(RUN_ROOT, exist_ok=True)

    path = None
    for _ in range(100):
        path = find_port()
        if path and os.path.exists(path):
            break
        time.sleep(0.05)
    if not path:
        log(f"virtio port {PORT_NAME!r} not found")
        sys.exit(1)

    _port_fd = os.open(path, os.O_RDWR)
    log("listening on", path)

    buf = b""
    while True:
        try:
            chunk = os.read(_port_fd, 65536)
        except OSError as e:
            log("read error:", e)
            time.sleep(0.1)
            continue
        if not chunk:          # host side not connected yet / disconnected
            time.sleep(0.05)
            continue
        buf += chunk
        while b"\n" in buf:
            line, buf = buf.split(b"\n", 1)
            if not line.strip():
                continue
            rid = None
            try:
                req = json.loads(line)
                rid = req.get("id")
                resp = handle(req)
            except Exception as e:
                resp = {"type": "error", "id": rid, "message": f"{type(e).__name__}: {e}"}
            if resp is not None:
                send(resp)


if __name__ == "__main__":
    main()

