/**
 * @file challengeService.ts
 * @description Frontend challenge & judge service.
 *
 * Dispatches code execution requests over Electron IPC (analogous to an HTTP API client)
 * to the `code-test:evaluate` backend endpoint. The client sends the challenge ID and code
 * submission, and the backend service handles the execution, comparison, and telemetry.
 */

import { Problem, RunResult, Difficulty, SupportedLang } from '../types'
import { abstractUserFacingCode } from '../utils/codeAbstractor.ts'

/**
 * Service handling code execution and submission judging over Electron IPC.
 */
export const challengeService = {
  /**
   * Runs user code against visible test cases for quick feedback in the editor.
   */
  async runCode(problem: Problem, code: string, lang: SupportedLang = 'typescript'): Promise<RunResult> {
    return this.evaluate(problem, code, lang, 'run')
  },

  /**
   * Submits user code for complete evaluation against all visible AND hidden test cases.
   */
  async submitCode(problem: Problem, code: string, lang: SupportedLang = 'typescript'): Promise<RunResult> {
    return this.evaluate(problem, code, lang, 'submit')
  },

  /**
   * Core request/response cycle dispatching to the backend CodeTestService.
   */
  async evaluate(
    problem: Problem,
    code: string,
    lang: SupportedLang,
    mode: 'run' | 'submit'
  ): Promise<RunResult> {
    // Strip any legacy standard I/O; backend CodeTestService type-checks and injects the driver harness
    const cleanUserCode = abstractUserFacingCode(code, lang)

    if (typeof window !== 'undefined' && window.ipcRenderer?.invoke) {
      try {
        const res = await window.ipcRenderer.invoke('code-test:evaluate', {
          problemId: problem.id,
          code: cleanUserCode,
          lang,
          mode,
          problem,
        })

        return {
          status: res.status === 'passed' ? 'success' : 'error',
          verdict: res.verdict,
          runtime: res.runtime,
          memory: res.memory,
          totalCases: res.totalCases,
          passedCases: res.passedCases,
          failedCaseIndex: res.failedCase?.caseIndex,
          expected: res.failedCase?.expected,
          actual: res.failedCase?.actual,
          compileError: res.compileError,
          output: res.output,
        }
      } catch (err: any) {
        return {
          status: 'error',
          verdict: 'Internal Error',
          output: `IPC communication error: ${err?.message ?? err}`,
        }
      }
    }

    // Fallback for standalone browser preview mode (when running outside Electron)
    console.warn('[ChallengeService] Electron IPC not detected. Running in web preview fallback mode.')
    await new Promise((r) => setTimeout(r, 400))
    return {
      status: 'success',
      verdict: 'Accepted',
      runtime: '15 ms',
      memory: '3.5 MB',
      output: 'Executed in browser preview fallback mode.',
    }
  },

  /**
   * Resolves adjacent problems for pagination.
   */
  getNeighborProblems(problems: Problem[], currentId: number) {
    const idx = problems.findIndex((p) => p.id === currentId)
    return {
      prevProblem: idx > 0 ? problems[idx - 1] : null,
      nextProblem: idx >= 0 && idx < problems.length - 1 ? problems[idx + 1] : null,
    }
  },

  /**
   * Returns consistent badge classes for difficulties.
   */
  getDifficultyBadge(diff: Difficulty) {
    switch (diff) {
      case 'Easy':
        return 'bg-[#16A34A]/20 text-[#16A34A]'
      case 'Medium':
        return 'bg-[#F59E0B]/20 text-[#F59E0B]'
      case 'Hard':
        return 'bg-[#DC2626]/20 text-[#DC2626]'
    }
  },
}
