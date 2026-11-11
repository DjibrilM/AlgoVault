import { AICategory, MarathonStep, Problem } from '@/shared/types/problem'

export interface GeneratedAICategoryResult {
  category: AICategory
  problems: Problem[]
  firstProblemId: number
}

export const homeService = {
  /**
   * Generates AI problems and an AICategory from a user prompt
   */
  generateAICategory(prompt: string): GeneratedAICategoryResult {
    const newId = Date.now()
    const newCategoryName = prompt.length > 25 ? `${prompt.slice(0, 22)}...` : prompt

    const generatedProblems: Problem[] = [
      {
        id: newId,
        slug: `ai-part1`,
        title: `${newCategoryName} - Problem 1`,
        difficulty: 'Easy',
        category: newCategoryName,
        acceptance: '68.0%',
        solved: false,
        starred: false,
        isAIGenerated: true,
        description: `### ${newCategoryName} (Part 1)\n\nGiven the requirements in your prompt: *"${prompt}"*, implement an optimal algorithm with $\\mathcal{O}(n \\log n)$ time complexity.\n\n$$T(n) = 2T\\!\\left(\\frac{n}{2}\\right) + \\mathcal{O}(n)$$`,
        examples: [{ id: 1, input: 'n = 5', output: 'true', explanation: 'For $n = 5$, all invariants hold in $\\mathcal{O}(n)$ steps.' }],
        constraints: ['$1 \\le n \\le 10^5$'],
        hints: ['Consider baseline constraints and divide-and-conquer recurrences.'],
        tags: [newCategoryName, 'AI-Generated'],
        codeTemplates: {
          typescript: `function solve(): boolean {\n  return true;\n}`,
          python: `def solve(): return True`,
          javascript: `function solve() { return true; }`,
          cpp: `bool solve() { return true; }`,
        },
        testCases: [{ id: 1, input: 'n = 5', expected: 'true' }],
      },
      {
        id: newId + 1,
        slug: `ai-part2`,
        title: `${newCategoryName} - Problem 2`,
        difficulty: 'Medium',
        category: newCategoryName,
        acceptance: '45.0%',
        solved: false,
        starred: false,
        isAIGenerated: true,
        description: `### ${newCategoryName} (Part 2 - Optimization)\n\nOptimize your solution to minimize total cost:\n\n$$\\min_{S} \\sum_{i=1}^{n} w_i \\cdot x_i \\quad \\text{subject to } \\sum_{i=1}^{n} x_i \\le K$$`,
        examples: [{ id: 1, input: 'arr = [1, 2, 3]', output: '6', explanation: 'Sum of elements $\\sum_{i=0}^{2} \\text{arr}[i] = 1 + 2 + 3 = 6$.' }],
        constraints: ['$1 \\le \\text{arr.length} \\le 10^5$'],
        hints: ['Use hashing or memoization over state space $\\mathcal{O}(n \\cdot K)$.'],
        tags: [newCategoryName, 'AI-Generated'],
        codeTemplates: {
          typescript: `function optimize(): number {\n  return 6;\n}`,
          python: `def optimize(): return 6`,
          javascript: `function optimize() { return 6; }`,
          cpp: `int optimize() { return 6; }`,
        },
        testCases: [{ id: 1, input: 'arr = [1, 2, 3]', expected: '6' }],
      },
    ]

    const category: AICategory = {
      id: `cat-${newId}`,
      name: newCategoryName,
      description: `AI Collection generated from prompt: "${prompt}"`,
      isCustom: true,
      problemIds: generatedProblems.map((p) => p.id),
    }

    return {
      category,
      problems: generatedProblems,
      firstProblemId: newId,
    }
  },

  /**
   * Calculates completion statistics for marathon track
   */
  getMarathonProgress(steps: MarathonStep[]) {
    const completedCount = steps.filter((s) => s.completed).length
    const totalCount = steps.length
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
    return {
      completedCount,
      totalCount,
      percentage,
      nextStep: completedCount + 1,
    }
  },
}
