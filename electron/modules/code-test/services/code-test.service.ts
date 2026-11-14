/**
 * @file code-test.service.ts
 * @description NestJS-style Provider handling SandboxVm lifecycle and challenge code evaluation.
 */

import type { DataSource } from 'typeorm'
import { SandboxVm, resolveDefaultAssetsDir } from '../../engine-runner/sandboxVm.ts'
import { EASY_PROBLEMS } from '../../../../src/shared/data/problems/easyProblems.ts'
import { injectHarnessWithBabel, hasStandardIO } from '../../../../src/modules/challenge/utils/babelInjector.ts'
import { abstractUserFacingCode } from '../../../../src/modules/challenge/utils/codeAbstractor.ts'
import { TypeCheckerService, type ITypeCheckerService } from './type-checker.service.ts'
import {
  CategoryEntity,
  ChallengeEntity,
  SubmissionEntity,
  FavoriteEntity,
  FactoryConversationEntity,
} from '../entities/index.ts'
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
  SaveFactoryConversationDto,
  PaginatedFactoryConversationsDto,
} from '../types/index.ts'

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
  private dataSource: DataSource | null = null

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
   * Attaches the TypeORM DataSource so evaluations and workspace queries persist to SQLite.
   */
  setDataSource(dataSource: DataSource): void {
    this.dataSource = dataSource
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

      // 1. Resolve target problem from DB, payload override, or in-memory catalog
      let problem = dto.problem ?? this.findProblemById(dto.problemId)
      if (!problem && this.dataSource) {
        const challengeRepo = this.dataSource.getRepository(ChallengeEntity)
        const record = await challengeRepo.findOne({
          where: { id: dto.problemId },
          relations: { category: true },
        })
        if (record) {
          problem = {
            id: record.id,
            slug: record.slug || `challenge-${record.id}`,
            title: record.title,
            difficulty: record.difficulty,
            category: record.category?.title ?? 'General',
            acceptance: record.acceptance || '50.0%',
            solved: record.solved,
            starred: record.starred,
            description: record.description,
            examples: (record.examples ?? []) as unknown as Problem['examples'],
            constraints: record.constraints ?? [],
            hints: record.hints ?? [],
            tags: record.tags ?? [],
            codeTemplates: (record.initialSolutions ?? {
              typescript: record.initialSolution,
              python: '',
              javascript: '',
              cpp: '',
            }) as Problem['codeTemplates'],
            testCases: (record.testCases ?? []) as unknown as Problem['testCases'],
          }
        }
      }
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
          const compileErrResult: EvaluationResultDto = {
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
          if (isSubmit) {
            await this.persistSubmission(dto.problemId, dto.lang, cleanCode, compileErrResult)
          }
          return compileErrResult
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
        const compileErrResult: EvaluationResultDto = {
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
        if (isSubmit) {
          await this.persistSubmission(dto.problemId, dto.lang, cleanCode, compileErrResult)
        }
        return compileErrResult
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

      const finalResult: EvaluationResultDto = {
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

      if (isSubmit) {
        await this.persistSubmission(dto.problemId, dto.lang, cleanCode, finalResult)
      }

      return finalResult
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

  /**
   * Inserts a new Submission record for a challenge and updates Challenge progress/solved status.
   */
  private async persistSubmission(
    challengeId: number,
    lang: string,
    code: string,
    result: EvaluationResultDto
  ): Promise<void> {
    if (!this.dataSource) return

    const challengeRepo = this.dataSource.getRepository(ChallengeEntity)
    const challenge = await challengeRepo.findOne({ where: { id: challengeId } })
    if (!challenge) return

    const submissionRepo = this.dataSource.getRepository(SubmissionEntity)

    const payload = {
      challengeId,
      lang,
      code,
      status: result.status,
      verdict: result.verdict,
      passedCases: result.passedCases,
      totalCases: result.totalCases,
      timeMs: result.timeMs,
      cpuMs: result.testCases.reduce((max, tc) => Math.max(max, tc.cpuMs ?? 0), 0),
      memoryKb: result.memoryKb,
      output: result.output ?? null,
      compileError: result.compileError ?? null,
      failedCase: (result.failedCase as Record<string, unknown>) ?? null,
      testCaseResults: result.testCases as unknown as Array<Record<string, unknown>>,
    }

    await submissionRepo.save(submissionRepo.create(payload))

    await challengeRepo.update(
      { id: challengeId },
      {
        solution: code,
        solved: challenge.solved || result.verdict === 'Accepted',
      }
    )
  }

  /**
   * Loads all categories, challenges, and submissions from SQLite.
   */
  async getWorkspaceData() {
    if (!this.dataSource) {
      return { categories: [], challenges: [], submissions: [] }
    }

    const categoryRepo = this.dataSource.getRepository(CategoryEntity)
    const challengeRepo = this.dataSource.getRepository(ChallengeEntity)
    const submissionRepo = this.dataSource.getRepository(SubmissionEntity)

    const [categories, challenges, submissions] = await Promise.all([
      categoryRepo.find({ relations: { challenges: true }, order: { id: 'ASC' } }),
      challengeRepo.find({ relations: { category: true }, order: { id: 'ASC' } }),
      submissionRepo.find({ relations: { challenge: true }, order: { updatedAt: 'DESC', id: 'DESC' } }),
    ])

    return { categories, challenges, submissions }
  }

  /**
   * Persists challenge user code progress (`solution`), `solved`, or `starred` flags.
   */
  async saveChallengeProgress(dto: {
    challengeId: number
    solution?: string
    solved?: boolean
    starred?: boolean
  }) {
    if (!this.dataSource) return null
    const challengeRepo = this.dataSource.getRepository(ChallengeEntity)
    const patch: Partial<{ solution: string; solved: boolean; starred: boolean }> = {}
    if (dto.solution !== undefined) patch.solution = dto.solution
    if (dto.solved !== undefined) patch.solved = dto.solved
    if (dto.starred !== undefined) patch.starred = dto.starred

    if (Object.keys(patch).length > 0) {
      await challengeRepo.update({ id: dto.challengeId }, patch)
    }
    return challengeRepo.findOne({ where: { id: dto.challengeId } })
  }

  /**
   * Creates a new Category (or reuses existing by title) and saves its Challenge(s) in SQLite.
   */
  async createCategory(dto: {
    title: string
    description: string
    challenge?: {
      title: string
      description: string
      difficulty?: 'Easy' | 'Medium' | 'Hard'
      initialSolutions?: Record<string, string>
      hints?: string[]
      tags?: string[]
      examples?: Array<Record<string, unknown>>
      constraints?: string[]
      testCases?: Array<Record<string, unknown>>
    }
    challenges?: Array<{
      title: string
      description: string
      difficulty?: 'Easy' | 'Medium' | 'Hard'
      initialSolutions?: Record<string, string>
      hints?: string[]
      tags?: string[]
      examples?: Array<Record<string, unknown>>
      constraints?: string[]
      testCases?: Array<Record<string, unknown>>
    }>
  }) {
    if (!this.dataSource) {
      throw new Error('Database is not initialized.')
    }

    const normalizedTitle = dto.title.trim()
    if (!normalizedTitle) {
      throw new Error('Category title cannot be empty.')
    }

    const categoryRepo = this.dataSource.getRepository(CategoryEntity)
    const challengeRepo = this.dataSource.getRepository(ChallengeEntity)

    // Never create a duplicate category if one with the same title already exists
    let category = await categoryRepo
      .createQueryBuilder('category')
      .where('LOWER(TRIM(category.title)) = LOWER(:title)', {
        title: normalizedTitle,
      })
      .getOne()

    const created = !category
    if (!category) {
      category = await categoryRepo.save(
        categoryRepo.create({
          title: normalizedTitle,
          description: dto.description,
        })
      )
    }

    const challengePayloads = dto.challenges?.length
      ? dto.challenges
      : dto.challenge
        ? [dto.challenge]
        : []

    if (challengePayloads.length === 0) {
      return { category, created }
    }

    const savedChallenges = []
    for (let idx = 0; idx < challengePayloads.length; idx++) {
      const item = challengePayloads[idx]
      const initialSolutions = item.initialSolutions ?? {
        typescript: '',
        javascript: '',
        python: '',
        cpp: '',
      }
      const baseSlug =
        item.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || 'challenge'
      const existingSlug = await challengeRepo.findOne({ where: { slug: baseSlug } })
      const slug = existingSlug ? `${baseSlug}-${Date.now()}-${idx}` : baseSlug

      const saved = await challengeRepo.save(
        challengeRepo.create({
          slug,
          title: item.title,
          description: item.description,
          difficulty: item.difficulty ?? 'Medium',
          acceptance: '50.0%',
          tags: item.tags ?? [],
          examples: item.examples ?? [],
          constraints: item.constraints ?? [],
          testCases: item.testCases ?? [],
          initialSolution: initialSolutions.typescript ?? '',
          initialSolutions,
          solution: '',
          hints: item.hints ?? [],
          solved: false,
          starred: false,
          categoryId: category.id,
        })
      )
      savedChallenges.push(saved)
    }

    return {
      category,
      created,
      challenge: savedChallenges[0],
      challenges: savedChallenges,
    }
  }

  /**
   * Returns recorded submissions from SQLite, optionally filtered by challengeId.
   */
  async getSubmissions(challengeId?: number) {
    if (!this.dataSource) return []
    const submissionRepo = this.dataSource.getRepository(SubmissionEntity)
    if (challengeId !== undefined) {
      return submissionRepo.find({
        where: { challengeId },
        relations: { challenge: true },
        order: { updatedAt: 'DESC', id: 'DESC' },
      })
    }
    return submissionRepo.find({
      relations: { challenge: true },
      order: { updatedAt: 'DESC', id: 'DESC' },
    })
  }

  /**
   * Returns all favorited challenges from SQLite.
   */
  async getFavorites() {
    if (!this.dataSource) return []
    const favoriteRepo = this.dataSource.getRepository(FavoriteEntity)
    return favoriteRepo.find({
      relations: { challenge: { category: true } },
      order: { createdAt: 'DESC', id: 'DESC' },
    })
  }

  /**
   * Toggles favorite status for a challenge and keeps `ChallengeEntity.starred` in sync.
   */
  async toggleFavorite(challengeId: number): Promise<{ favorited: boolean }> {
    if (!this.dataSource) return { favorited: false }

    const favoriteRepo = this.dataSource.getRepository(FavoriteEntity)
    const challengeRepo = this.dataSource.getRepository(ChallengeEntity)

    const existing = await favoriteRepo.findOne({ where: { challengeId } })
    if (existing) {
      await favoriteRepo.delete({ id: existing.id })
      await challengeRepo.update({ id: challengeId }, { starred: false })
      return { favorited: false }
    }

    await favoriteRepo.save(favoriteRepo.create({ challengeId }))
    await challengeRepo.update({ id: challengeId }, { starred: true })
    return { favorited: true }
  }

  /**
   * Returns paginated Questions Factory conversations ordered most-recently-updated first.
   */
  async getFactoryConversations(dto: { page?: number; limit?: number } = {}): Promise<PaginatedFactoryConversationsDto> {
    const safeLimit = Math.min(Math.max(Math.trunc(dto.limit ?? 10), 1), 50)
    const safePage = Math.max(Math.trunc(dto.page ?? 0), 0)

    if (!this.dataSource) {
      return { items: [], page: safePage, limit: safeLimit, total: 0, hasMore: false }
    }

    const repo = this.dataSource.getRepository(FactoryConversationEntity)
    const [items, total] = await repo.findAndCount({
      order: { updatedAt: 'DESC', createdAt: 'DESC', id: 'DESC' },
      skip: safePage * safeLimit,
      take: safeLimit,
    })

    return {
      items,
      page: safePage,
      limit: safeLimit,
      total,
      hasMore: (safePage + 1) * safeLimit < total,
    }
  }

  /**
   * Creates or updates a Questions Factory conversation snapshot in SQLite.
   */
  async saveFactoryConversation(dto: SaveFactoryConversationDto) {
    if (!this.dataSource) return null

    const repo = this.dataSource.getRepository(FactoryConversationEntity)
    const normalizedTitle = dto.title.trim() || 'Untitled Conversation'
    const existing = await repo.findOne({ where: { id: dto.id } })

    if (existing) {
      existing.title = normalizedTitle
      existing.messages = dto.messages
      existing.draft = dto.draft
      existing.generatedQuestions = dto.generatedQuestions
      existing.generatedTarget = dto.generatedTarget
      existing.updatedAt = new Date()
      return repo.save(existing)
    }

    return repo.save(
      repo.create({
        id: dto.id,
        title: normalizedTitle,
        messages: dto.messages,
        draft: dto.draft,
        generatedQuestions: dto.generatedQuestions,
        generatedTarget: dto.generatedTarget,
      })
    )
  }
}
