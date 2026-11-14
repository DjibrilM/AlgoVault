import { atom, Getter, Setter } from 'jotai'
import {
  Problem,
  AICategory,
  MarathonStep,
  MarathonTrack,
  SubmissionRecordDto,
} from '@/shared/types/problem'
import {
  INITIAL_PROBLEMS,
  INITIAL_AI_CATEGORIES,
  INITIAL_MARATHON_STEPS,
  INITIAL_MARATHONS,
} from '@/shared/data/mockProblems'
import { databaseClient } from '@/shared/services/databaseClient'
import { queryClient, QUERY_KEYS } from '@/shared/lib/queryClient'
import { NavSection } from '@/layout/types'
import { activeNavAtom } from './navigationAtoms'

export interface ActiveCategoryState {
  name: string
  isMarathon: boolean
}

export interface NavigationSnapshot {
  activeNav: NavSection
  isViewingAllMarathons: boolean
  isViewingAiStudio: boolean
  isSolvingChallenge: boolean
  activeCategory: ActiveCategoryState | null
  selectedProblemId: number
}

const INITIAL_SNAPSHOT: NavigationSnapshot = {
  activeNav: 'home',
  isViewingAllMarathons: false,
  isViewingAiStudio: false,
  isSolvingChallenge: false,
  activeCategory: null,
  selectedProblemId: 100,
}

const IS_ELECTRON = databaseClient.isAvailable()

// Base State Atoms (hydrated from SQLite in Electron; fallback to static data only in web preview)
export const problemsAtom = atom<Problem[]>(IS_ELECTRON ? [] : INITIAL_PROBLEMS)
export const categoriesAtom = atom<AICategory[]>(IS_ELECTRON ? [] : INITIAL_AI_CATEGORIES)
export const submissionsAtom = atom<SubmissionRecordDto[]>([])
export const workspaceLoadedAtom = atom<boolean>(!IS_ELECTRON)
export const marathonStepsAtom = atom<MarathonStep[]>(INITIAL_MARATHON_STEPS)
export const marathonsAtom = atom<MarathonTrack[]>(INITIAL_MARATHONS)
export const activeMarathonIdAtom = atom<string | null>(null)
export const isViewingAllMarathonsAtom = atom<boolean>(false)
export const isViewingAiStudioAtom = atom<boolean>(false)
export const isSolvingChallengeAtom = atom<boolean>(false)
export const activeCategoryAtom = atom<ActiveCategoryState | null>(null)
export const selectedProblemIdAtom = atom<number>(100)
export const isSidebarOpenAtom = atom<boolean>(true)
export const navHistoryAtom = atom<NavigationSnapshot[]>([INITIAL_SNAPSHOT])
export const navHistoryIndexAtom = atom<number>(0)

function isSameSnapshot(a: NavigationSnapshot, b: NavigationSnapshot): boolean {
  return (
    a.activeNav === b.activeNav &&
    a.isViewingAllMarathons === b.isViewingAllMarathons &&
    a.isViewingAiStudio === b.isViewingAiStudio &&
    a.isSolvingChallenge === b.isSolvingChallenge &&
    a.selectedProblemId === b.selectedProblemId &&
    a.activeCategory?.name === b.activeCategory?.name &&
    a.activeCategory?.isMarathon === b.activeCategory?.isMarathon
  )
}

function pushNavSnapshot(get: Getter, set: Setter) {
  const snapshot: NavigationSnapshot = {
    activeNav: get(activeNavAtom),
    isViewingAllMarathons: get(isViewingAllMarathonsAtom),
    isViewingAiStudio: get(isViewingAiStudioAtom),
    isSolvingChallenge: get(isSolvingChallengeAtom),
    activeCategory: get(activeCategoryAtom),
    selectedProblemId: get(selectedProblemIdAtom),
  }

  const history = get(navHistoryAtom)
  const index = get(navHistoryIndexAtom)
  const current = history[index]
  if (current && isSameSnapshot(current, snapshot)) return

  const nextHistory = [...history.slice(0, index + 1), snapshot]
  set(navHistoryAtom, nextHistory)
  set(navHistoryIndexAtom, nextHistory.length - 1)
}

function applyNavSnapshot(set: Setter, snapshot: NavigationSnapshot) {
  set(activeNavAtom, snapshot.activeNav)
  set(isViewingAllMarathonsAtom, snapshot.isViewingAllMarathons)
  set(isViewingAiStudioAtom, snapshot.isViewingAiStudio)
  set(isSolvingChallengeAtom, snapshot.isSolvingChallenge)
  set(activeCategoryAtom, snapshot.activeCategory)
  set(selectedProblemIdAtom, snapshot.selectedProblemId)
}

export const canGoBackAtom = atom<boolean>((get) => get(navHistoryIndexAtom) > 0)
export const canGoForwardAtom = atom<boolean>(
  (get) => get(navHistoryIndexAtom) < get(navHistoryAtom).length - 1
)

export const goBackAtom = atom(null, (get, set) => {
  const index = get(navHistoryIndexAtom)
  if (index <= 0) return
  const history = get(navHistoryAtom)
  const nextIndex = index - 1
  set(navHistoryIndexAtom, nextIndex)
  applyNavSnapshot(set, history[nextIndex])
})

export const goForwardAtom = atom(null, (get, set) => {
  const index = get(navHistoryIndexAtom)
  const history = get(navHistoryAtom)
  if (index >= history.length - 1) return
  const nextIndex = index + 1
  set(navHistoryIndexAtom, nextIndex)
  applyNavSnapshot(set, history[nextIndex])
})

// Helper pure functions
export function findCategoryByTitle(
  categories: AICategory[],
  title: string
): AICategory | undefined {
  const normalized = title.trim().toLowerCase()
  return categories.find((cat) => cat.name.trim().toLowerCase() === normalized)
}

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
export const hydrateWorkspaceAtom = atom(null, async (get, set) => {
  const snapshot = await databaseClient.getWorkspaceData()
  if (!snapshot) return

  set(categoriesAtom, snapshot.categories)
  set(problemsAtom, snapshot.problems)
  set(submissionsAtom, snapshot.submissions)
  set(workspaceLoadedAtom, true)

  const currentId = get(selectedProblemIdAtom)
  if (
    snapshot.problems.length > 0 &&
    !snapshot.problems.some((p) => p.id === currentId)
  ) {
    set(selectedProblemIdAtom, snapshot.problems[0].id)
  }
})

export const refreshSubmissionsAtom = atom(null, async (_get, set) => {
  const subs = await databaseClient.getSubmissions()
  set(submissionsAtom, subs)
})

export const solveProblemAtom = atom(
  null,
  (_get, set, problemId: number) => {
    // 1. Mark problem solved locally & in SQLite
    set(problemsAtom, (prev) =>
      prev.map((p) => (p.id === problemId ? { ...p, solved: true } : p))
    )
    void databaseClient.saveChallengeProgress({
      challengeId: problemId,
      solved: true,
    })

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
  (get, set, payload: { name: string; isMarathon?: boolean; startSolving?: boolean }) => {
    const isMarathon = Boolean(payload.isMarathon)
    set(activeNavAtom, 'home')
    set(activeCategoryAtom, { name: payload.name, isMarathon })
    set(isViewingAllMarathonsAtom, false)
    set(isViewingAiStudioAtom, false)
    set(isSolvingChallengeAtom, Boolean(payload.startSolving))
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

    pushNavSnapshot(get, set)
  }
)

export const openChallengeAtom = atom(
  null,
  (get, set, problemId: number) => {
    set(selectedProblemIdAtom, problemId)
    set(isSolvingChallengeAtom, true)
    set(isSidebarOpenAtom, true)
    pushNavSnapshot(get, set)
  }
)

export const backToCategoryListAtom = atom(
  null,
  (get, set) => {
    set(isSolvingChallengeAtom, false)
    pushNavSnapshot(get, set)
  }
)

export const closeCategoryAtom = atom(
  null,
  (get, set) => {
    set(activeCategoryAtom, null)
    set(isSolvingChallengeAtom, false)
    pushNavSnapshot(get, set)
  }
)

export const navigateSectionAtom = atom(
  null,
  (get, set, nav: NavSection) => {
    set(activeNavAtom, nav)
    if (nav === 'home') {
      set(activeCategoryAtom, null)
      set(isViewingAllMarathonsAtom, false)
      set(isViewingAiStudioAtom, false)
      set(isSolvingChallengeAtom, false)
    }
    pushNavSnapshot(get, set)
  }
)

export const viewAllMarathonsAtom = atom(
  null,
  (get, set) => {
    set(activeNavAtom, 'home')
    set(isViewingAllMarathonsAtom, true)
    set(isViewingAiStudioAtom, false)
    set(activeCategoryAtom, null)
    set(isSolvingChallengeAtom, false)
    pushNavSnapshot(get, set)
  }
)

export const openAiStudioAtom = atom(
  null,
  (get, set) => {
    set(activeNavAtom, 'home')
    set(isViewingAiStudioAtom, true)
    set(isViewingAllMarathonsAtom, false)
    set(activeCategoryAtom, null)
    set(isSolvingChallengeAtom, false)
    pushNavSnapshot(get, set)
  }
)

export const generateCategoryAtom = atom(
  null,
  async (get, set, prompt: string) => {
    const rawName = prompt.trim()
    const newCategoryName = rawName.length > 25 ? `${rawName.slice(0, 22)}...` : rawName

    if (databaseClient.isAvailable()) {
      const result = await databaseClient.createCategory({
        title: newCategoryName,
        description: `Collection created from prompt: "${prompt}"`,
        challenge: {
          title: `${newCategoryName} Challenge`,
          description: `### ${newCategoryName}\n\nGiven the requirements in your prompt: *"${prompt}"*, implement an optimal algorithm.`,
          difficulty: 'Medium',
          tags: [newCategoryName],
          examples: [{ id: 1, input: 'n = 5', output: 'true' }],
          constraints: ['$1 \\le n \\le 10^5$'],
          hints: ['Break the problem down into base cases and optimal substructure.'],
          initialSolutions: {
            typescript: `function solve(): boolean {\n  return true;\n}`,
            python: `def solve() -> bool:\n    return True`,
            javascript: `function solve() {\n  return true;\n}`,
            cpp: `bool solve() {\n    return true;\n}`,
          },
          testCases: [{ id: 1, input: 'n = 5', expected: 'true' }],
        },
      })

      await set(hydrateWorkspaceAtom)
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workspace })
      set(activeCategoryAtom, {
        name: result?.category?.title ?? newCategoryName,
        isMarathon: false,
      })
      set(isSidebarOpenAtom, true)
      pushNavSnapshot(get, set)
      return
    }

    const newId = Date.now()

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

    const generatedIds = generatedProblems.map((p) => p.id)
    const existingCat = findCategoryByTitle(get(categoriesAtom), newCategoryName)
    const targetCategoryName = existingCat?.name ?? newCategoryName

    if (existingCat) {
      set(categoriesAtom, (prev) =>
        prev.map((cat) =>
          cat.id === existingCat.id
            ? { ...cat, problemIds: [...cat.problemIds, ...generatedIds] }
            : cat
        )
      )
    } else {
      const newCat: AICategory = {
        id: `cat-${newId}`,
        name: newCategoryName,
        description: `AI Collection generated from prompt: "${prompt}"`,
        isCustom: true,
        problemIds: generatedIds,
      }
      set(categoriesAtom, (prev) => [newCat, ...prev])
    }

    set(activeCategoryAtom, { name: targetCategoryName, isMarathon: false })
    set(selectedProblemIdAtom, newId)
    set(isSidebarOpenAtom, true)
    pushNavSnapshot(get, set)
  }
)

export const toggleSidebarAtom = atom(
  null,
  (_get, set) => {
    set(isSidebarOpenAtom, (prev) => !prev)
  }
)
