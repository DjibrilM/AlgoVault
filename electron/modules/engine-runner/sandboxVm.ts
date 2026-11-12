/**
 * @file sandboxVm.ts
 * @description Host-side controller for an isolated AlgoVault sandbox Virtual Machine.
 *
 * This module manages the lifecycle of a QEMU micro-VM used to safely execute untrusted
 * user-submitted code in Python, JavaScript, TypeScript, C, and C++.
 *
 * Architecture Summary:
 * 1. Host side: Spawns QEMU with hardware acceleration (macOS Hypervisor.framework 'hvf'
 *    or Linux KVM). Attaches an ext4 root filesystem containing Alpine Linux in read-only mode,
 *    and provides no virtual network interface (-nic none).
 * 2. Communication channel: QEMU connects a host-side Unix domain socket to an emulated
 *    virtio-serial port exposed inside the guest as a character device (/dev/vport0p1).
 * 3. Guest side: The kernel boots directly into an init script that mounts transient
 *    memory filesystems (tmpfs on /tmp) and executes a Python supervisor agent (agent.py).
 * 4. Wire protocol: Host and guest communicate via an RPC mechanism exchanging
 *    newline-delimited JSON (NDJSON) messages correlated by request IDs.
 *
 * Note: Written using only erasable TypeScript syntax so it executes directly under
 * `node file.ts` (used by scripts/smoke-test.ts) without a transpilation step, while also
 * bundling cleanly with Vite for Electron.
 */

import { spawn, type ChildProcess } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { existsSync, rmSync, mkdtempSync } from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Supported guest/host CPU architectures for the sandbox VM.
 */
export type VmArch = 'arm64' | 'x64'

/**
 * Normalizes a Node.js `process.arch` string or folder suffix into a `VmArch`.
 */
export function resolveVmArch(arch: string = process.arch): VmArch {
  if (arch === 'arm64' || arch === 'aarch64') return 'arm64'
  if (arch === 'x64' || arch === 'x86_64' || arch === 'amd64') return 'x64'
  throw new Error(`Unsupported sandbox VM architecture: ${arch}`)
}

/**
 * Infers the VM architecture from an assets directory name (e.g. `macos-x64` -> `x64`),
 * falling back to the current host `process.arch`.
 */
export function inferArchFromAssetsDir(assetsDir: string): VmArch {
  const base = path.basename(assetsDir).toLowerCase()
  if (base.endsWith('-x64') || base.endsWith('-x86_64') || base.endsWith('-amd64')) {
    return 'x64'
  }
  if (base.endsWith('-arm64') || base.endsWith('-aarch64')) {
    return 'arm64'
  }
  return resolveVmArch(process.arch)
}

/**
 * Returns the platform folder name under `assets/` for a given architecture and OS
 * (e.g. `macos-arm64` or `macos-x64`).
 */
export function getPlatformFolderName(
  arch: VmArch = resolveVmArch(process.arch),
  platform: string = process.platform,
): string {
  const osPrefix = platform === 'darwin' ? 'macos' : platform
  return `${osPrefix}-${arch}`
}

/**
 * Resolves the default asset directory for the QEMU binary, Linux kernel Image, and rootfs.ext4
 * based on the current OS and CPU architecture (`macos-arm64` on Apple Silicon, `macos-x64` on Intel).
 */
export function resolveDefaultAssetsDir(arch?: VmArch): string {
  const targetArch = arch ?? resolveVmArch(process.arch)
  const platformFolder = getPlatformFolderName(targetArch, process.platform)

  const currentDir = typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url))

  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath

  const candidates = [
    ...(resourcesPath ? [path.join(resourcesPath, 'assets', platformFolder)] : []),
    path.resolve(currentDir, 'assets', platformFolder),
    path.resolve(currentDir, '../../engine-runner/assets', platformFolder),
    path.resolve(process.cwd(), 'electron/modules/engine-runner/assets', platformFolder),
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate
    }
  }

  return candidates[0]
}

/**
 * Supported programming languages for sandbox execution.
 */
export type Language = 'python' | 'javascript' | 'typescript' | 'c' | 'cpp'

/**
 * Execution request payload sent from the host to the guest VM.
 */
export interface RunRequest {
  /** Target programming language for the submission. */
  lang: Language

  /** Complete source code of the user submission. */
  code: string

  /**
   * Array of test cases. For compiled languages (C, C++), the source is compiled
   * exactly once, and the resulting binary is executed against each test case sequentially.
   */
  tests?: { stdin?: string }[]

  /**
   * Shorthand standard input for a single test run when `tests` is omitted.
   */
  stdin?: string

  /**
   * Maximum wall-clock execution time allowed per individual test case run (in milliseconds).
   * Defaults to 5,000 ms if omitted.
   */
  timeoutMs?: number

  /**
   * Maximum wall-clock time allowed for compilation in compiled languages (in milliseconds).
   * Defaults to 20,000 ms if omitted.
   */
  compileTimeoutMs?: number

  /**
   * Maximum memory (virtual address space or V8 heap limit) permitted for the process (in megabytes).
   * Defaults to 256 MB if omitted.
   */
  memoryMb?: number
}

/**
 * Execution outcome metrics returned for a single program invocation (compilation or test run).
 */
export interface ExecResult {
  /** Numeric process exit code, or null if terminated by an unhandled signal. */
  exitCode: number | null

  /** Name of the terminating POSIX signal (e.g., 'SIGSEGV', 'SIGKILL'), or null if exited normally. */
  signal: string | null

  /** True if the execution was aborted due to exceeding wall-clock or CPU time limits. */
  timedOut: boolean

  /** Standard output captured from the process (capped at 1 MB). */
  stdout: string

  /** Standard error captured from the process (capped at 1 MB). */
  stderr: string

  /** Total elapsed wall-clock execution time in milliseconds. */
  timeMs: number

  /** Total CPU time consumed in user and kernel modes (ru_utime + ru_stime) in milliseconds. */
  cpuMs: number

  /** Peak resident set size (physical RAM usage) reported by Linux getrusage in kilobytes. */
  memoryKb: number

  /** True if stdout, stderr, or written files exceeded size caps and were truncated. */
  outputTruncated: boolean
}

/**
 * Aggregate result of a submission, covering compilation and all test case runs.
 */
export interface RunResult {
  /**
   * Output from the compiler step (for C and C++). Null for interpreted or JIT languages.
   * If compilation fails (exitCode !== 0), `runs` will be an empty array.
   */
  compile: ExecResult | null

  /** Array of individual execution results corresponding to each entry in `RunRequest.tests`. */
  runs: ExecResult[]
}

/**
 * Configuration options required to instantiate and boot a SandboxVm.
 */
export interface SandboxVmOptions {
  /**
   * Directory holding the QEMU binary, Linux kernel Image, and rootfs.ext4 disk image.
   * Defaults to `electron/modules/engine-runner/assets/<platform>-<arch>` based on OS & CPU.
   */
  assetsDir?: string

  /**
   * Target VM architecture ('arm64' or 'x64').
   * Defaults to inferring from `assetsDir` or the host's `process.arch`.
   */
  arch?: VmArch

  /**
   * Memory allocated to the guest virtual machine in megabytes. Defaults to 1024 MB.
   */
  memoryMb?: number

  /**
   * Number of virtual CPU cores allocated to the guest virtual machine. Defaults to 2.
   */
  cpus?: number

  /**
   * Maximum time to wait for the VM to boot and respond to initial health checks.
   * Defaults to 30,000 ms (30 seconds).
   */
  bootTimeoutMs?: number

  /**
   * Optional callback receiving raw console output streamed from the guest kernel
   * and agent via the virtual serial port. Useful for debugging and smoke testing.
   */
  onConsole?: (chunk: string) => void
}

/**
 * Internal record for tracking in-flight asynchronous RPC requests across the Unix socket.
 */
interface Pending {
  resolve: (msg: any) => void
  reject: (err: Error) => void
}

/**
 * Controller class managing a single QEMU micro-VM sandbox instance.
 *
 * Lifecycle:
 * 1. Instantiate `const vm = new SandboxVm(opts)`.
 * 2. Call `await vm.start()` to launch QEMU, establish the socket, and verify agent readiness.
 * 3. Submit jobs sequentially using `await vm.run(req)`.
 * 4. Call `await vm.stop()` to cleanly power down the VM and release allocated resources.
 */
export class SandboxVm extends EventEmitter {
  /** Complete configuration options with default values applied. */
  private readonly opts: Required<Omit<SandboxVmOptions, 'onConsole'>> & Pick<SandboxVmOptions, 'onConsole'>

  /** Child process handle for the running QEMU instance. */
  private qemu: ChildProcess | null = null

  /** Connected client socket communicating with the guest agent. */
  private socket: net.Socket | null = null

  /** Path to the temporary directory hosting the Unix domain socket file. */
  private tmpDir: string | null = null

  /** In-memory accumulation buffer for incoming partial NDJSON chunks. */
  private buffer = ''

  /** Monotonically increasing counter used to assign unique IDs to RPC requests. */
  private nextId = 1

  /** Map of active in-flight requests keyed by request ID string. */
  private pending = new Map<string, Pending>()

  /** Promise chain ensuring requests are executed sequentially one at a time. */
  private queue: Promise<unknown> = Promise.resolve()

  /** Flag indicating whether the QEMU process has terminated. */
  private exited = false

  /** Tool and runtime versions reported by the guest agent upon successful boot. */
  versions: Record<string, string> = {}

  /** Buffer of recent VM console output for diagnostics if boot fails. */
  private bootLogs: string[] = []

  constructor(opts: SandboxVmOptions = {}) {
    super()
    const arch = opts.arch ?? (opts.assetsDir ? inferArchFromAssetsDir(opts.assetsDir) : resolveVmArch(process.arch))
    const assetsDir = opts.assetsDir ?? resolveDefaultAssetsDir(arch)
    this.opts = {
      assetsDir,
      arch,
      memoryMb: opts.memoryMb ?? 1024,
      cpus: opts.cpus ?? 2,
      bootTimeoutMs: opts.bootTimeoutMs ?? 30_000,
      onConsole: opts.onConsole,
    }
  }

  /**
   * Returns true if the QEMU process is currently spawned and has not exited.
   */
  get running(): boolean {
    return this.qemu !== null && !this.exited
  }

  /**
   * Boots the QEMU virtual machine, establishes the host-guest socket connection,
   * and completes the initial readiness handshake.
   *
   * @throws Error if required binary or disk assets are missing, or if boot times out.
   */
  async start(): Promise<void> {
    const { assetsDir, arch } = this.opts
    const isArm64 = arch === 'arm64'

    const qemuBinName = isArm64 ? 'qemu-system-aarch64' : 'qemu-system-x86_64'
    const qemuBin = path.join(assetsDir, qemuBinName)

    // Support 'Image' (standard across both folders) or 'bzImage' fallback for x86_64
    const imageCandidate = path.join(assetsDir, 'Image')
    const bzImageCandidate = path.join(assetsDir, 'bzImage')
    const kernel = (!isArm64 && !existsSync(imageCandidate) && existsSync(bzImageCandidate))
      ? bzImageCandidate
      : imageCandidate

    const rootfs = path.join(assetsDir, 'rootfs.ext4')

    // Verify all pre-built VM artifacts exist before attempting to spawn QEMU.
    for (const f of [qemuBin, kernel, rootfs]) {
      if (!existsSync(f)) throw new Error(`missing sandbox asset (${arch}): ${f}`)
    }

    // Allocate a unique temporary directory for the Unix domain socket.
    // Notice the short prefix 'avvm-': Unix domain socket paths in the sockaddr_un
    // struct have a strict length limit (104 bytes on macOS, 108 bytes on Linux).
    // On macOS, prefer '/tmp' over '/var/folders/...' to prevent length and sandbox permission limits.
    const tmpBase = process.platform === 'darwin' ? '/tmp' : os.tmpdir()
    this.tmpDir = mkdtempSync(path.join(tmpBase, 'avvm-'))
    const sockPath = path.join(this.tmpDir, 'agent.sock')

    // Select hardware hypervisor acceleration when host CPU matches guest architecture:
    // - macOS Hypervisor.framework ('hvf') or Linux KVM ('kvm') with '-cpu host'
    // - Falls back to software TCG emulation ('tcg') with '-cpu max' if cross-testing architectures.
    const hostArch = resolveVmArch(process.arch)
    const canUseHwAccel = hostArch === arch
    const accel = canUseHwAccel ? (process.platform === 'darwin' ? 'hvf' : 'kvm') : 'tcg'
    const cpuModel = canUseHwAccel ? 'host' : 'max'

    // Architecture-specific machine, serial console, and virtio bus device types:
    // - arm64: 'virt' machine, PL011 UART (ttyAMA0), virtio MMIO devices (*-device)
    // - x64:   'pc' machine, 8250 UART (ttyS0), virtio PCI devices (*-pci)
    const machine = isArm64 ? 'virt' : 'pc'
    const consoleDev = isArm64 ? 'ttyAMA0' : 'ttyS0'
    const virtioBlkDevice = isArm64 ? 'virtio-blk-device,drive=root' : 'virtio-blk-pci,drive=root'
    const virtioRngDevice = isArm64 ? 'virtio-rng-device' : 'virtio-rng-pci'
    const virtioSerialDevice = isArm64 ? 'virtio-serial-device' : 'virtio-serial-pci'

    // Build the QEMU command-line argument list.
    const args = [
      // Virtual machine machine type and CPU configuration:
      '-M', machine, '-accel', accel, '-cpu', cpuModel,

      // Sizing: Memory and virtual CPU core counts.
      '-m', String(this.opts.memoryMb), '-smp', String(this.opts.cpus),

      // Stripping unused virtual hardware to minimize attack surface and startup time:
      // -nodefaults: Do not attach default CD-ROM, audio, network, or storage controllers.
      // -no-user-config: Ignore any host-level QEMU configuration files.
      // -no-reboot: If the guest kernel reboots or encounters a panic, terminate QEMU immediately.
      '-nodefaults', '-no-user-config', '-no-reboot',

      // Headless execution: No display window, no interactive management monitor.
      // Redirect guest serial console directly to QEMU's stdout/stderr.
      '-display', 'none', '-monitor', 'none', '-serial', 'stdio',

      // Kernel and bootloader configuration:
      // Direct kernel boot without an intermediary bootloader (like GRUB) for sub-second startup.
      '-kernel', kernel,

      // Linux kernel command line arguments:
      // - root=/dev/vda ro rootfstype=ext4: Mount first virtio disk as root in read-only mode.
      // - console=ttyAMA0 / ttyS0: Route kernel messages to the virtual UART serial device.
      // - init=/sbin/algovault-init: Bypass standard multi-user systemd/OpenRC and run our custom PID 1 script.
      // - quiet: Suppress non-critical kernel boot messages for faster, cleaner startup.
      // - panic=-1: Trigger immediate reboot/exit upon kernel panic (caught by -no-reboot to terminate QEMU).
      '-append', `root=/dev/vda ro rootfstype=ext4 console=${consoleDev} init=/sbin/algovault-init quiet panic=-1`,

      // Storage subsystem:
      // Mount rootfs.ext4 as a read-only virtio block device (/dev/vda).
      // Enforcing readonly=on at the hypervisor level guarantees no writes can persist to the disk.
      '-drive', `file=${rootfs},if=none,format=raw,readonly=on,id=root`,
      '-device', virtioBlkDevice,

      // Entropy source: Provide hardware random number generation to prevent blocking on /dev/random.
      '-device', virtioRngDevice,

      // Communication subsystem:
      // Create a virtio-serial bus and expose a named port ('algovault.agent').
      // QEMU exposes this port to the host as a listening Unix domain socket at `sockPath`.
      // wait=off instructs QEMU to continue booting without waiting for a host client connection.
      '-device', virtioSerialDevice,
      '-chardev', `socket,id=agent,path=${sockPath},server=on,wait=off`,
      '-device', 'virtserialport,chardev=agent,name=algovault.agent',

      // Isolation: Explicitly disable all network hardware. The VM cannot access LAN or Internet.
      '-nic', 'none',
    ]

    // Spawn QEMU as a child process.
    const qemu = spawn(qemuBin, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    this.qemu = qemu

    // Reset boot logs and pipe serial console output.
    this.bootLogs = []
    const handleLog = (d: string) => {
      this.bootLogs.push(d)
      if (this.bootLogs.length > 50) this.bootLogs.shift()
      this.opts.onConsole?.(d)
    }

    qemu.stdout!.setEncoding('utf8').on('data', handleLog)
    qemu.stderr!.setEncoding('utf8').on('data', handleLog)

    // Handle unexpected or orderly termination of the QEMU process.
    qemu.on('exit', (code, signal) => {
      this.exited = true

      // Reject all pending in-flight RPC promises with an error indicating VM exit.
      const err = new Error(`sandbox VM exited (code=${code}, signal=${signal})`)
      for (const p of this.pending.values()) p.reject(err)
      this.pending.clear()

      // Close communication socket and clean up temporary directory.
      this.socket?.destroy()
      this.cleanupTmp()

      // Emit exit event for external listeners.
      this.emit('exit', code, signal)
    })

    const deadline = Date.now() + this.opts.bootTimeoutMs

    // Poll until the host Unix socket file is created by QEMU and accepts connections.
    this.socket = await this.connect(sockPath, deadline)
    this.socket.setEncoding('utf8')
    this.socket.on('data', (d: string) => this.onData(d))
    this.socket.on('error', () => {
      // Socket errors during teardown are expected; handled gracefully via exit listeners.
    })

    // Handshake: The socket may be connected before the guest agent opens its end of the virtio port.
    // Repeatedly ping the agent until it replies with a pong containing runtime versions.
    const pong = await this.waitForPong(deadline)
    this.versions = pong.versions ?? {}
  }

  /**
   * Executes a user submission inside the sandbox VM.
   *
   * Submissions are queued sequentially: each request waits for previous runs to finish
   * so that CPU, memory, and timeout measurements are accurate and isolated.
   *
   * @param req The execution parameters, code, and test cases.
   * @returns Promise resolving to compilation output and individual test case results.
   */
  run(req: RunRequest): Promise<RunResult> {
    // Chain onto the promise queue to ensure strict sequential execution.
    const job = this.queue.then(() => {
      // Calculate an upper bound timeout for the entire request across compilation and all test runs.
      const timeout = (req.compileTimeoutMs ?? 20_000) +
        (req.timeoutMs ?? 5_000) * Math.max(1, req.tests?.length ?? 1) + 10_000
      return this.request({ type: 'run', ...req }, timeout)
    })

    // Keep the queue alive even if this specific job fails or rejects.
    this.queue = job.catch(() => {})

    return job.then((msg) => ({ compile: msg.compile, runs: msg.runs }))
  }

  /**
   * Orderly shutdown of the sandbox VM.
   *
   * Sends a shutdown command to the guest agent to invoke `poweroff -f`.
   * If the process does not terminate within 3 seconds, forces shutdown via SIGKILL.
   */
  async stop(): Promise<void> {
    if (!this.running) return
    const exited = new Promise<void>((r) => this.qemu!.once('exit', () => r()))
    try {
      // Ask guest agent to perform a fast poweroff.
      await this.request({ type: 'shutdown' }, 2_000).catch(() => {})
    } finally {
      // Fallback timer: force kill QEMU if graceful poweroff hangs.
      const t = setTimeout(() => this.qemu?.kill('SIGKILL'), 3_000)
      await exited
      clearTimeout(t)
    }
  }

  /**
   * Immediately terminates the QEMU process using SIGKILL without waiting for graceful shutdown.
   */
  kill(): void {
    this.qemu?.kill('SIGKILL')
  }

  // ------------------------------------------------------------------------ //
  // Internal RPC Transport Implementation
  // ------------------------------------------------------------------------ //

  /**
   * Dispatches an RPC request over the Unix socket using Newline-Delimited JSON (NDJSON).
   *
   * @param body Payload dictionary (must contain `type`).
   * @param timeoutMs Maximum time to wait before rejecting the request.
   * @returns Promise resolving to the parsed response object from the guest agent.
   */
  private request(body: Record<string, unknown>, timeoutMs: number): Promise<any> {
    if (!this.running || !this.socket) return Promise.reject(new Error('sandbox VM is not running'))

    // Generate unique numeric ID for request correlation.
    const id = String(this.nextId++)

    return new Promise((resolve, reject) => {
      // Set timer to reject the request if no response arrives within the specified window.
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`sandbox request ${body.type} timed out`))
      }, timeoutMs)

      // Store resolver callbacks indexed by request ID.
      this.pending.set(id, {
        resolve: (m) => { clearTimeout(timer); resolve(m) },
        reject: (e) => { clearTimeout(timer); reject(e) },
      })

      // Transmit single-line JSON string terminated by newline.
      this.socket!.write(JSON.stringify({ ...body, id }) + '\n')
    })
  }

  /**
   * Stream data handler for incoming socket bytes.
   *
   * Buffers chunks, slices complete lines delimited by `\n`, parses the NDJSON messages,
   * and dispatches them to their corresponding pending promise resolvers.
   */
  private onData(chunk: string): void {
    this.buffer += chunk
    let nl: number

    // Extract all complete lines currently available in the buffer.
    while ((nl = this.buffer.indexOf('\n')) >= 0) {
      const line = this.buffer.slice(0, nl).trim()
      this.buffer = this.buffer.slice(nl + 1)
      if (!line) continue

      let msg: any
      try {
        msg = JSON.parse(line)
      } catch {
        // Skip malformed lines or console noise.
        continue
      }

      // Correlate message with pending request via response ID.
      const p = this.pending.get(String(msg.id))
      if (!p) continue
      this.pending.delete(String(msg.id))

      // Resolve or reject according to response type.
      if (msg.type === 'error') p.reject(new Error(msg.message))
      else p.resolve(msg)
    }
  }

  /**
   * Retries connection to the Unix domain socket until successful or until the deadline expires.
   *
   * Handles race conditions during QEMU boot where the socket file does not yet exist
   * (ENOENT) or QEMU is not yet actively listening for connections (ECONNREFUSED).
   */
  private async connect(sockPath: string, deadline: number): Promise<net.Socket> {
    while (Date.now() < deadline) {
      if (this.exited) {
        const lastOutput = this.bootLogs.join('').trim()
        const detail = lastOutput ? `\nVM Console Output:\n${lastOutput}` : ''
        throw new Error(`sandbox VM exited during boot${detail}`)
      }

      try {
        return await new Promise<net.Socket>((resolve, reject) => {
          const s = net.createConnection(sockPath)
          s.once('connect', () => {
            s.removeAllListeners('error')
            resolve(s)
          })
          s.once('error', reject)
        })
      } catch (e: any) {
        // ENOENT: Socket file hasn't been created on disk yet.
        // ECONNREFUSED: Socket file exists, but QEMU is still initializing the listener.
        // EPERM / EACCES: Transient permission state while QEMU creates the socket on macOS.
        // Both are normal transient states during boot; sleep briefly and retry.
        if (e?.code !== 'ENOENT' && e?.code !== 'ECONNREFUSED' && e?.code !== 'EPERM' && e?.code !== 'EACCES') {
          this.kill()
          const lastOutput = this.bootLogs.join('').trim()
          const detail = lastOutput ? `\nVM Console Output:\n${lastOutput}` : ''
          throw new Error(`cannot connect to sandbox VM socket: ${e?.message ?? e}${detail}`)
        }
        await sleep(25)
      }
    }
    const lastOutput = this.bootLogs.join('').trim()
    const detail = lastOutput ? `\nVM Console Output:\n${lastOutput}` : ''
    throw new Error(`timed out connecting to sandbox VM (${this.opts.bootTimeoutMs}ms)${detail}`)
  }

  /**
   * Probes the guest agent with ping requests until a pong is received or the deadline expires.
   *
   * Needed because the host socket may connect as soon as QEMU initializes its chardev,
   * before the guest Linux kernel has finished booting or launched the agent script.
   */
  private async waitForPong(deadline: number): Promise<any> {
    while (Date.now() < deadline) {
      if (this.exited) {
        const lastOutput = this.bootLogs.join('').trim()
        const detail = lastOutput ? `\nVM Console Output:\n${lastOutput}` : ''
        throw new Error(`sandbox VM exited during boot${detail}`)
      }
      try {
        return await this.request({ type: 'ping' }, 300)
      } catch {
        // Agent not awake or virtio port not opened yet; continue polling.
      }
    }
    this.kill()
    const lastOutput = this.bootLogs.join('').trim()
    const detail = lastOutput ? `\nVM Console Output:\n${lastOutput}` : ''
    throw new Error(`sandbox VM did not become ready in time (${this.opts.bootTimeoutMs}ms)${detail}`)
  }

  /**
   * Recursively deletes the temporary directory holding the Unix domain socket.
   */
  private cleanupTmp(): void {
    if (this.tmpDir) rmSync(this.tmpDir, { recursive: true, force: true })
    this.tmpDir = null
  }
}

/**
 * Asynchronous pause helper returning a Promise that resolves after `ms` milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
