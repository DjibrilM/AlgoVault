import { Problem, RunResult, Difficulty } from '../types'

/**
 * Service handling code execution simulation, submissions, and problem navigation
 */
export const challengeService = {
  /**
   * Simulates running code against sample test cases
   */
  async runCode(problem: Problem, code: string): Promise<RunResult> {
    void code
    await new Promise((resolve) => setTimeout(resolve, 550))
    const sampleOutput = problem.testCases?.[0]?.expected ?? 'true'
    return {
      status: 'success',
      runtime: `${Math.floor(Math.random() * 20 + 35)} ms`,
      memory: `${(Math.random() * 2 + 42).toFixed(1)} MB`,
      output: sampleOutput,
    }
  },

  /**
   * Simulates submitting solution for full evaluation
   */
  async submitCode(problem: Problem, code: string): Promise<RunResult> {
    void problem
    void code
    await new Promise((resolve) => setTimeout(resolve, 850))
    return {
      status: 'success',
      runtime: `${Math.floor(Math.random() * 15 + 28)} ms`,
      memory: `${(Math.random() * 2 + 41).toFixed(1)} MB`,
      output: 'Accepted on 54 / 54 testcases',
    }
  },

  /**
   * Resolves adjacent problems for pagination
   */
  getNeighborProblems(problems: Problem[], currentId: number) {
    const idx = problems.findIndex((p) => p.id === currentId)
    return {
      prevProblem: idx > 0 ? problems[idx - 1] : null,
      nextProblem: idx >= 0 && idx < problems.length - 1 ? problems[idx + 1] : null,
    }
  },

  /**
   * Returns consistent badge classes for difficulties
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
