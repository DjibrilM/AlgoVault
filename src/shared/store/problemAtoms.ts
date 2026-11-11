import { atom } from 'jotai'
import {
  Problem,
  AICategory,
  MarathonStep,
} from '@/shared/types/problem'
import {
  INITIAL_PROBLEMS,
  INITIAL_AI_CATEGORIES,
  INITIAL_MARATHON_STEPS,
} from '@/shared/data/mockProblems'

export interface ActiveCategoryState {
  name: string
  isMarathon: boolean
}

// Base State Atoms
export const problemsAtom = atom<Problem[]>(INITIAL_PROBLEMS)
export const categoriesAtom = atom<AICategory[]>(INITIAL_AI_CATEGORIES)
export const marathonStepsAtom = atom<MarathonStep[]>(INITIAL_MARATHON_STEPS)
export const activeCategoryAtom = atom<ActiveCategoryState | null>(null)
export const selectedProblemIdAtom = atom<number>(1)
export const isSidebarOpenAtom = atom<boolean>(true)

// Helper pure function
export function getCategoryProblemsList(
  problems: Problem[],
  categories: AICategory[],
  marathonSteps: MarathonStep[],
  catName: string,
  isMarathon: boolean
): Problem[] {
  if (isMarathon) {
    return marathonSteps
      .map((step) => problems.find((p) => p.id === step.problemId))
      .filter((p): p is Problem => Boolean(p))
  }
  const cat = categories.find((c) => c.name === catName)
  if (cat) {
    return problems.filter((p) => cat.problemIds.includes(p.id))
  }
  return problems.filter((p) => p.category === catName)
}

// Derived Atoms
export const activeProblemsAtom = atom<Problem[]>((get) => {
  const activeCat = get(activeCategoryAtom)
  if (!activeCat) return []
  const problems = get(problemsAtom)
  const categories = get(categoriesAtom)
  const marathonSteps = get(marathonStepsAtom)
  return getCategoryProblemsList(
    problems,
    categories,
    marathonSteps,
    activeCat.name,
    activeCat.isMarathon
  )
})

export const currentProblemAtom = atom<Problem>((get) => {
  const problems = get(problemsAtom)
  const selectedId = get(selectedProblemIdAtom)
  return (
    problems.find((p) => p.id === selectedId) ||
    problems[0] || {
      id: 1,
      slug: 'sample',
      title: 'No problem selected',
      difficulty: 'Easy',
      category: 'General',
      acceptance: '50%',
      solved: false,
      starred: false,
      description: 'Select a problem from the sidebar.',
      examples: [],
      constraints: [],
      hints: [],
      tags: [],
      codeTemplates: { typescript: '', python: '', javascript: '', cpp: '' },
      testCases: [],
    }
  )
})

// Action Atoms
export const solveProblemAtom = atom(
  null,
  (_get, set, problemId: number) => {
    // 1. Mark problem solved
    set(problemsAtom, (prev) =>
      prev.map((p) => (p.id === problemId ? { ...p, solved: true } : p))
    )

    // 2. Unlock next marathon milestone if this problem was in the track
    set(marathonStepsAtom, (prev) => {
      const idx = prev.findIndex((s) => s.problemId === problemId)
      if (idx !== -1) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], completed: true }
        if (idx + 1 < copy.length) {
          copy[idx + 1] = { ...copy[idx + 1], locked: false }
        }
        return copy
      }
      return prev
    })
  }
)

export const selectCategoryAtom = atom(
  null,
  (get, set, payload: { name: string; isMarathon?: boolean }) => {
    const isMarathon = Boolean(payload.isMarathon)
    set(activeCategoryAtom, { name: payload.name, isMarathon })
    set(isSidebarOpenAtom, true)

    const problems = get(problemsAtom)
    const categories = get(categoriesAtom)
    const marathonSteps = get(marathonStepsAtom)
    const catProblems = getCategoryProblemsList(
      problems,
      categories,
      marathonSteps,
      payload.name,
      isMarathon
    )

    if (catProblems.length > 0) {
      set(selectedProblemIdAtom, catProblems[0].id)
    }
  }
)

export const generateCategoryAtom = atom(
  null,
  (_get, set, prompt: string) => {
    const newId = Date.now()
    const newCategoryName = prompt.length > 25 ? `${prompt.slice(0, 22)}...` : prompt

    const generatedProblems: Problem[] = [
      {
        id: newId,
        slug: 'ai-part1',
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
        slug: 'ai-part2',
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

    set(problemsAtom, (prev) => [...generatedProblems, ...prev])

    const newCat: AICategory = {
      id: `cat-${newId}`,
      name: newCategoryName,
      description: `AI Collection generated from prompt: "${prompt}"`,
      isCustom: true,
      problemIds: generatedProblems.map((p) => p.id),
    }

    set(categoriesAtom, (prev) => [newCat, ...prev])
    set(activeCategoryAtom, { name: newCategoryName, isMarathon: false })
    set(selectedProblemIdAtom, newId)
    set(isSidebarOpenAtom, true)
  }
)

export const toggleSidebarAtom = atom(
  null,
  (_get, set) => {
    set(isSidebarOpenAtom, (prev) => !prev)
  }
)
