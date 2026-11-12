/**
 * Boots the sandbox VM and runs a small program in every supported language.
 *
 *   node electron/modules/engine-runner/scripts/smoke-test.ts [--console] [--arch arm64|x64]
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  SandboxVm,
  resolveVmArch,
  getPlatformFolderName,
  type Language,
  type RunResult,
  type VmArch,
} from '../sandboxVm.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const archFlagIdx = process.argv.indexOf('--arch')
const targetArch: VmArch = archFlagIdx >= 0 && process.argv[archFlagIdx + 1]
  ? resolveVmArch(process.argv[archFlagIdx + 1])
  : resolveVmArch(process.arch)
const platformFolder = getPlatformFolderName(targetArch, process.platform)
const assetsDir = path.resolve(here, `../assets/${platformFolder}`)
const showConsole = process.argv.includes('--console')

const SUM_INPUT = [{ stdin: '1 2\n' }, { stdin: '40 2\n' }]

const programs: Record<Language, string> = {
  python: `a, b = map(int, input().split())\nprint(a + b)\n`,
  javascript: `const [a, b] = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number)\nconsole.log(a + b)\n`,
  typescript: `import { readFileSync } from 'node:fs'\nenum Op { Add }\nconst [a, b]: number[] = readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number)\nconst op: Op = Op.Add\nconsole.log(op === Op.Add ? a + b : 0)\n`,
  c: `#include <stdio.h>\nint main(void){ long a,b; scanf("%ld %ld",&a,&b); printf("%ld\\n", a+b); return 0; }\n`,
  cpp: `#include <bits/stdc++.h>\nint main(){ long long a,b; std::cin>>a>>b; std::vector<long long> v{a,b}; std::cout<<std::accumulate(v.begin(),v.end(),0LL)<<"\\n"; }\n`,
}

// Programs that must be stopped by the sandbox.
const hostile: { name: string; lang: Language; code: string; expect: (r: RunResult) => boolean }[] = [
  {
    name: 'infinite loop is killed',
    lang: 'python', code: 'while True: pass\n',
    expect: (r) => r.runs[0].timedOut,
  },
  {
    name: 'memory bomb is stopped',
    lang: 'cpp', code: '#include <vector>\nint main(){ std::vector<char*> v; for(;;) { char* p = new char[1<<20]; p[0]=1; v.push_back(p);} }\n',
    expect: (r) => r.runs[0].exitCode !== 0,
  },
  {
    name: 'fork bomb is contained',
    lang: 'python', code: 'import os\nwhile True:\n    try: os.fork()\n    except OSError: pass\n',
    expect: (r) => r.runs[0].timedOut || r.runs[0].exitCode !== 0,
  },
  {
    name: 'no network access',
    lang: 'python', code: 'import socket\ntry:\n    socket.create_connection(("1.1.1.1", 80), timeout=2); print("CONNECTED")\nexcept OSError as e: print("blocked:", e)\n',
    expect: (r) => r.runs[0].stdout.startsWith('blocked'),
  },
  {
    name: 'root filesystem is read-only',
    lang: 'python', code: 'try:\n    open("/etc/pwned", "w"); print("WROTE")\nexcept OSError as e: print("blocked:", e)\n',
    expect: (r) => r.runs[0].stdout.startsWith('blocked'),
  },
  {
    name: 'compile error is reported',
    lang: 'c', code: 'int main(void) { return x; }\n',
    expect: (r) => r.compile !== null && r.compile.exitCode !== 0 && r.compile.stderr.includes('x'),
  },
]

let failures = 0
const check = (ok: boolean, label: string, detail = '') => {
  if (!ok) failures++
  console.log(`${ok ? '  ✔' : '  ✘'} ${label}${detail ? `  ${detail}` : ''}`)
}

const vm = new SandboxVm({
  assetsDir,
  arch: targetArch,
  onConsole: showConsole ? (d) => process.stdout.write(d) : undefined,
})

const t0 = Date.now()
await vm.start()
console.log(`VM (${platformFolder}) ready in ${Date.now() - t0} ms`, vm.versions)

console.log('\nLanguages (a + b, two test cases):')
for (const [lang, code] of Object.entries(programs) as [Language, string][]) {
  const t = Date.now()
  try {
    const r = await vm.run({ lang, code, tests: SUM_INPUT })
    const outs = r.runs.map((x) => x.stdout.trim())
    const ok = outs.join(',') === '3,42'
    const err = r.compile?.exitCode ? r.compile.stderr : r.runs.find((x) => x.stderr)?.stderr ?? ''
    check(ok, lang.padEnd(11), `${Date.now() - t} ms` + (ok ? '' : `  got=${JSON.stringify(outs)} ${err.slice(0, 400)}`))
  } catch (e) {
    check(false, lang, String(e))
  }
}

console.log('\nIsolation:')
for (const h of hostile) {
  const t = Date.now()
  try {
    const r = await vm.run({ lang: h.lang, code: h.code, timeoutMs: 2_000 })
    const ok = h.expect(r)
    check(ok, h.name.padEnd(30), `${Date.now() - t} ms` + (ok ? '' : `  ${JSON.stringify(r).slice(0, 400)}`))
  } catch (e) {
    check(false, h.name, String(e))
  }
}

// VM must still be usable after the hostile programs.
const after = await vm.run({ lang: 'python', code: 'print("still alive")' })
check(after.runs[0].stdout.trim() === 'still alive', 'VM healthy after hostile runs')

await vm.stop()
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed')
process.exit(failures ? 1 : 0)

