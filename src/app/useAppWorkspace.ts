import { useCallback } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { NavSection } from '@layout'
import { useKeyboardShortcut } from '@shared'
import {
  activeNavAtom,
  problemsAtom,
  categoriesAtom,
  marathonStepsAtom,
  activeCategoryAtom,
  activeProblemsAtom,
  selectedProblemIdAtom,
  isSidebarOpenAtom,
  toggleSidebarAtom,
  solveProblemAtom,
  selectCategoryAtom,
  generateCategoryAtom,
} from '@/shared/store'

/**
 * Top-level workspace state orchestrator backed by Jotai global state atoms.
 * Coordinates navigation, categories, problems, and cross-feature transitions.
 */
export function useAppWorkspace() {
  const [activeNav, setActiveNav] = useAtom(activeNavAtom)
  const [problems] = useAtom(problemsAtom)
  const [categories] = useAtom(categoriesAtom)
  const [marathonSteps] = useAtom(marathonStepsAtom)
  const [activeCategory, setActiveCategory] = useAtom(activeCategoryAtom)
  const activeProblems = useAtomValue(activeProblemsAtom)
  const [selectedProblemId, setSelectedProblemId] = useAtom(selectedProblemIdAtom)
  const [isSidebarOpen, setIsSidebarOpen] = useAtom(isSidebarOpenAtom)

  const toggleSidebarAction = useSetAtom(toggleSidebarAtom)
  const solveProblem = useSetAtom(solveProblemAtom)
  const selectCategory = useSetAtom(selectCategoryAtom)
  const generateCategory = useSetAtom(generateCategoryAtom)

  const toggleSidebar = useCallback(() => {
    toggleSidebarAction()
  }, [toggleSidebarAction])

  useKeyboardShortcut('b', toggleSidebar)

  const handleSolveProblem = (problemId: number) => {
    solveProblem(problemId)
  }

  const handleSelectCategory = (catName: string, isMarathon = false) => {
    selectCategory({ name: catName, isMarathon })
  }

  const handleGenerateCategory = (prompt: string) => {
    generateCategory(prompt)
  }

  const handleNavChange = (nav: NavSection) => {
    setActiveNav(nav)
    if (nav === 'home') {
      setActiveCategory(null)
    }
  }

  const returnHome = () => {
    setActiveNav('home')
    setActiveCategory(null)
  }

  const closeCategory = () => {
    setActiveCategory(null)
  }

  return {
    activeNav,
    problems,
    categories,
    marathonSteps,
    activeCategory,
    activeProblems,
    selectedProblemId,
    isSidebarOpen,
    setSelectedProblemId,
    setIsSidebarOpen,
    toggleSidebar,
    handleSolveProblem,
    handleSelectCategory,
    handleGenerateCategory,
    handleNavChange,
    returnHome,
    closeCategory,
  }
}
