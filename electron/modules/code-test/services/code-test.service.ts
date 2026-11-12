/**
 * @file code-test.service.ts
 * @description NestJS-style Provider handling SandboxVm lifecycle and challenge code evaluation.
 */

import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SandboxVm } from '../../engine-runner/sandboxVm.ts'
import { EASY_PROBLEMS } from '../../../../src/shared/data/problems/easyProblems.ts'
import { injectHarnessWithBabel, hasStandardIO } from '../../../../src/modules/challenge/utils/babelInjector.ts'
import { abstractUserFacingCode } from '../../../../src/modules/challenge/utils/codeAbstractor.ts'
import { TypeCheckerService, type ITypeCheckerService } from './type-checker.service.ts'
import type { Problem } from '../../../../src/shared/types/problem.ts'
import type { OnModuleDestroy } from '../common/lifecycle.ts'
import type {
  ICodeTestService,
  CodeTestServiceOptions,
  RunCodeDto,
  CodeTestResultDto,
  VmStatusDto,
  EvaluateCodeDto,
  EvaluationResultDto,
  TestCaseResultDto,
} from '../types/index.ts'

/**
 * Resolves the default asset directory for the QEMU binary, Linux kernel Image, and rootfs.ext4.
 */
function resolveDefaultAssetsDir(): string {
  const isDarwin = process.platform === 'darwin'
  const platformFolder = isDarwin ? 'macos-arm64' : `${process.platform}-${process.arch}`

  const currentDir = typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url))

  const candidates = [
    path.resolve(currentDir, '../../engine-runner/assets', platformFolder),
    path.resolve(process.cwd(), 'electron/modules/engine-runner/assets', platformFolder),
    path.join(process.resourcesPath || '', 'assets', platformFolder),
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate
    }
  }

  return candidates[0]
}

/**
 * Normalizes output strings for robust judge comparison (handles whitespace, JSON arrays, and booleans).
 */
function matchesExpected(actual: string, expected: string): boolean {
  const normActual = actual.replace(/\r\n/g, '\n').trim()
  const normExpected = expected.replace(/\r\n/g, '\n').trim()

  if (normActual === normExpected) return true
  if (normActual.replace(/\s+/g, ' ') === normExpected.replace(/\s+/g, ' ')) return true

  // Case-insensitive comparison for boolean outputs ('true' vs 'True')
  if (normActual.toLowerCase() === normExpected.toLowerCase()) return true

  // JSON array/object structure comparison
  try {
    const aJson = JSON.parse(normActual)
    const eJson = JSON.parse(normExpected)
    if (JSON.stringify(aJson) === JSON.stringify(eJson)) return true
  } catch {
    // Ignore JSON parse errors
  }

  return false
}

/**
 * NestJS-style Injectable Service Provider.
 *
 * Implements the request/response challenge evaluation cycle:
 * receives the challenge ID and code submission, runs it in SandboxVm,
 * compares outputs, and returns whether it passed or failed with full telemetry.
 */
export class CodeTestService implements ICodeTestService, OnModuleDestroy {
  private vm: SandboxVm | null = null
  private startPromise: Promise<VmStatusDto> | null = null
  private readonly options: CodeTestServiceOptions
  private readonly assetsDir: string
  private readonly problemCatalog = new Map<number, Problem>()
  private readonly typeChecker: ITypeCheckerService

  constructor(options: CodeTestServiceOptions = {}) {
    this.options = options
    this.assetsDir = options.assetsDir ?? resolveDefaultAssetsDir()
    this.typeChecker = options.typeChecker ?? new TypeCheckerService()

    // Seed known problems into the catalog
    for (const p of EASY_PROBLEMS) {
      this.problemCatalog.set(p.id, p)
    }

    if (options.autoStart) {
      this.startVm().catch((err) => {
        console.error('[CodeTestService] Failed to auto-start SandboxVm:', err)
      })
    }
  }

  /**
   * Registers a problem into the in-memory catalog.
   */
  registerProblem(problem: Problem): void {
    this.problemCatalog.set(problem.id, problem)
  }

  /**
   * Finds a problem by ID from the catalog.
   */
  findProblemById(id: number): Problem | undefined {
    return this.problemCatalog.get(id)
  }

  /**
   * NestJS Lifecycle hook: called when the module is destroyed.
   */
  async onModuleDestroy(): Promise<void> {
    await this.stopVm()
  }

  /**
   * Ensures the VM is running, awaiting an active boot promise if one is already underway.
   */
  private async ensureVmRunning(): Promise<void> {
    if (this.vm?.running) {
      return
    }

    if (this.startPromise) {
      await this.startPromise
      return
    }

    await this.startVm()
  }

  /**
   * Boots the sandbox virtual machine and awaits the pong handshake.
   */
  async startVm(): Promise<VmStatusDto> {
    if (this.vm?.running) {
      return {
        running: true,
        versions: this.vm.versions,
      }
    }

    if (this.startPromise) {
      return this.startPromise
    }

    this.startPromise = (async () => {
      try {
        const vm = new SandboxVm({
          assetsDir: this.assetsDir,
          memoryMb: this.options.memoryMb ?? 1024,
          cpus: this.options.cpus ?? 2,
          bootTimeoutMs: this.options.bootTimeoutMs ?? 30_000,
          onConsole: this.options.onConsole,
        })

        vm.on('exit', () => {
          if (this.vm === vm) {
            this.vm = null
          }
        })

        await vm.start()
        this.vm = vm

        return {
          running: true,
          versions: vm.versions,
        }
      } finally {
        this.startPromise = null
      }
    })()

    return this.startPromise
  }

  /**
   * Gracefully powers down the virtual machine.
   */
  async stopVm(): Promise<void> {
    if (!this.vm) {
      return
    }

    const currentVm = this.vm
    this.vm = null

    try {
      await currentVm.stop()
    } catch (err) {
      console.warn('[CodeTestService] Error during VM stop, forcing kill:', err)
      currentVm.kill()
    }
  }

  /**
   * Returns current operational status of the VM.
   */
  getStatus(): VmStatusDto {
    return {
      running: this.vm?.running ?? false,
      versions: this.vm?.versions ?? {},
    }
  }

  /**
   * Unified Evaluation: Receives challenge ID and code submission, runs the code
   * against visible or hidden test cases, judges the results, and returns comprehensive telemetry.
   */
  async evaluate(dto: EvaluateCodeDto): Promise<EvaluationResultDto> {
    try {
      if (!dto || !dto.code || !dto.code.trim()) {
        return {
          status: 'error',
          verdict: 'Runtime Error',
          passedCases: 0,
          totalCases: 0,
          runtime: '0 ms',
          memory: '0 MB',
          timeMs: 0,
          memoryKb: 0,
          output: 'No code submitted for evaluation.',
          testCases: [],
        }
      }

      // 1. Resolve target problem from catalog or payload override
      const problem = dto.problem ?? this.findProblemById(dto.problemId)
      if (!problem) {
        return {
          status: 'error',
          verdict: 'Internal Error',
          passedCases: 0,
          totalCases: 0,
          runtime: '0 ms',
          memory: '0 MB',
          timeMs: 0,
          memoryKb: 0,
          output: `Challenge #${dto.problemId} not found in catalog.`,
          testCases: [],
        }
      }

      // 2. Select test cases: 'run' mode tests visible cases; 'submit' tests all cases (including hidden)
      const isSubmit = dto.mode === 'submit'
      const testCases = isSubmit
        ? problem.testCases
        : problem.testCases.filter((tc) => !tc.hidden)

      const casesToRun = testCases.length > 0 ? testCases : problem.testCases
      if (casesToRun.length === 0) {
        return {
          status: 'error',
          verdict: 'Internal Error',
          passedCases: 0,
          totalCases: 0,
          runtime: '0 ms',
          memory: '0 MB',
          timeMs: 0,
          memoryKb: 0,
          output: 'No test cases available for this challenge.',
          testCases: [],
        }
      }

      const cleanCode = abstractUserFacingCode(dto.code, dto.lang as any)

      // 2.5 For TypeScript submissions, run static type analysis and report Compile Error if invalid
      if (dto.lang === 'typescript') {
        const typeErrors = this.typeChecker.checkTypeScript(cleanCode)
        if (typeErrors.length > 0) {
          const errorLog = typeErrors.join('\n')
          return {
            status: 'error',
            verdict: 'Compile Error',
            passedCases: 0,
            totalCases: casesToRun.length,
            runtime: '0 ms',
            memory: '0 MB',
            timeMs: 0,
            memoryKb: 0,
            compileError: errorLog,
            output: errorLog,
            testCases: [],
          }
        }
      }

      // 3. Execute code inside the Sandbox micro-VM
      const timeoutMs = dto.timeoutMs ?? 5000
      const memoryMb = dto.memoryMb ?? 256
      const hasIO = hasStandardIO(cleanCode, dto.lang as any)
      const codeToRun = hasIO ? cleanCode : injectHarnessWithBabel(cleanCode, dto.lang as any, problem)
      const tests = casesToRun.map((tc) => {
        if (hasIO && tc.stdin) {
          return { stdin: tc.stdin }
        }
        return { stdin: (tc.input ? tc.input.trim() + '\n' : '') || tc.stdin || '' }
      })

      const vmResult = await this.runCode({
        lang: dto.lang,
        code: codeToRun,
        tests,
        timeoutMs,
        memoryMb,
      })

      if (!vmResult.success) {
        throw new Error(vmResult.error || 'Sandbox execution failed.')
      }

      // 5. Evaluate Compiler Error (for C, C++)
      if (vmResult.compile && vmResult.compile.exitCode !== 0) {
        const errorLog = vmResult.compile.stderr || vmResult.compile.stdout || 'Compilation failed.'
        return {
          status: 'error',
          verdict: 'Compile Error',
          passedCases: 0,
          totalCases: casesToRun.length,
          runtime: `${vmResult.compile.timeMs} ms`,
          memory: `${(vmResult.compile.memoryKb / 1024).toFixed(1)} MB`,
          timeMs: vmResult.compile.timeMs,
          memoryKb: vmResult.compile.memoryKb,
          compileError: errorLog,
          output: errorLog,
          testCases: [],
        }
      }

      // 6. Judge per-testcase execution and output correctness
      let maxTimeMs = 0
      let maxMemoryKb = 0
      let passedCases = 0
      const caseResults: TestCaseResultDto[] = []
      let failedCaseInfo: EvaluationResultDto['failedCase'] | undefined
      let verdict: EvaluationResultDto['verdict'] = 'Accepted'

      for (let i = 0; i < casesToRun.length; i++) {
        const tc = casesToRun[i]
        const run = vmResult.runs[i]
        if (!run) continue

        maxTimeMs = Math.max(maxTimeMs, run.timeMs)
        maxMemoryKb = Math.max(maxMemoryKb, run.memoryKb)

        // Time Limit Exceeded
        if (run.timedOut || run.signal === 'SIGXCPU') {
          const detail = `Time Limit Exceeded (> ${timeoutMs}ms)`
          caseResults.push({
            id: tc.id,
            passed: false,
            hidden: Boolean(tc.hidden),
            input: tc.hidden ? '<hidden>' : tc.input,
            expected: tc.hidden ? '<hidden>' : tc.expected,
            actual: '',
            timeMs: run.timeMs,
            cpuMs: run.cpuMs,
            memoryKb: run.memoryKb,
            error: detail,
          })
          if (!failedCaseInfo) {
            failedCaseInfo = {
              caseIndex: i + 1,
              hidden: Boolean(tc.hidden),
              input: tc.hidden ? '<hidden>' : tc.input,
              expected: tc.hidden ? '<hidden>' : tc.expected,
              actual: '',
              error: detail,
            }
            verdict = 'Time Limit Exceeded'
          }
          continue
        }

        // Runtime Error
        if (run.exitCode !== 0 || run.signal) {
          const errDetail = run.stderr.trim() || `Process exited with code ${run.exitCode}${run.signal ? ` (${run.signal})` : ''}`
          caseResults.push({
            id: tc.id,
            passed: false,
            hidden: Boolean(tc.hidden),
            input: tc.hidden ? '<hidden>' : tc.input,
            expected: tc.hidden ? '<hidden>' : tc.expected,
            actual: run.stdout.trim(),
            timeMs: run.timeMs,
            cpuMs: run.cpuMs,
            memoryKb: run.memoryKb,
            error: errDetail,
          })
          if (!failedCaseInfo) {
            failedCaseInfo = {
              caseIndex: i + 1,
              hidden: Boolean(tc.hidden),
              input: tc.hidden ? '<hidden>' : tc.input,
              expected: tc.hidden ? '<hidden>' : tc.expected,
              actual: run.stdout.trim(),
              error: errDetail,
            }
            verdict = 'Runtime Error'
          }
          continue
        }

        // Output comparison
        const passed = matchesExpected(run.stdout, tc.expected)
        if (passed) {
          passedCases++
          caseResults.push({
            id: tc.id,
            passed: true,
            hidden: Boolean(tc.hidden),
            input: tc.hidden ? '<hidden>' : tc.input,
            expected: tc.hidden ? '<hidden>' : tc.expected,
            actual: run.stdout.trim(),
            timeMs: run.timeMs,
            cpuMs: run.cpuMs,
            memoryKb: run.memoryKb,
          })
        } else {
          caseResults.push({
            id: tc.id,
            passed: false,
            hidden: Boolean(tc.hidden),
            input: tc.hidden ? '<hidden>' : tc.input,
            expected: tc.hidden ? '<hidden>' : tc.expected,
            actual: run.stdout.trim(),
            timeMs: run.timeMs,
            cpuMs: run.cpuMs,
            memoryKb: run.memoryKb,
            error: 'Wrong Answer',
          })
          if (!failedCaseInfo) {
            failedCaseInfo = {
              caseIndex: i + 1,
              hidden: Boolean(tc.hidden),
              input: tc.hidden ? '<hidden>' : tc.input,
              expected: tc.hidden ? '<hidden>' : tc.expected,
              actual: run.stdout.trim(),
            }
            verdict = 'Wrong Answer'
          }
        }
      }

      const allPassed = passedCases === casesToRun.length
      const status: EvaluationResultDto['status'] = allPassed ? 'passed' : 'failed'

      // Formulate user-facing output message
      let outputSummary = ''
      if (allPassed) {
        outputSummary = isSubmit
          ? `Accepted! Passed all ${passedCases}/${casesToRun.length} test cases (including hidden edge cases).`
          : (caseResults[0]?.actual || 'All visible test cases passed.')
      } else if (failedCaseInfo) {
        outputSummary = failedCaseInfo.hidden
          ? `${verdict} on test case #${failedCaseInfo.caseIndex} (Hidden Test Case).`
          : `${verdict} on test case #${failedCaseInfo.caseIndex}:\nInput: ${failedCaseInfo.input}\nExpected: ${failedCaseInfo.expected}\nGot: ${failedCaseInfo.actual || '(empty)'}`
      }

      return {
        status,
        verdict,
        passedCases,
        totalCases: casesToRun.length,
        runtime: `${maxTimeMs} ms`,
        memory: `${(maxMemoryKb / 1024).toFixed(1)} MB`,
        timeMs: maxTimeMs,
        memoryKb: maxMemoryKb,
        output: outputSummary,
        failedCase: failedCaseInfo,
        testCases: caseResults,
      }
    } catch (err: any) {
      return {
        status: 'error',
        verdict: 'Internal Error',
        passedCases: 0,
        totalCases: 0,
        runtime: '0 ms',
        memory: '0 MB',
        timeMs: 0,
        memoryKb: 0,
        output: err?.message ?? String(err),
        testCases: [],
      }
    }
  }

  /**
   * Low-level raw run endpoint (backward-compatible).
   */
  async runCode(dto: RunCodeDto): Promise<CodeTestResultDto> {
    try {
      if (!dto || !dto.code) {
        return {
          success: false,
          runs: [],
          error: 'Missing required code submission in request.',
        }
      }

      if (!dto.lang) {
        return {
          success: false,
          runs: [],
          error: 'Missing programming language specification in request.',
        }
      }

      await this.ensureVmRunning()
      if (!this.vm || !this.vm.running) {
        throw new Error('Sandbox virtual machine failed to initialize.')
      }

      const result = await this.vm.run({
        lang: dto.lang,
        code: dto.code,
        tests: dto.tests,
        stdin: dto.stdin,
        timeoutMs: dto.timeoutMs,
        compileTimeoutMs: dto.compileTimeoutMs,
        memoryMb: dto.memoryMb,
      })

      return {
        success: true,
        compile: result.compile,
        runs: result.runs,
      }
    } catch (err: any) {
      return {
        success: false,
        runs: [],
        error: err?.message ?? String(err),
      }
    }
  }
}
