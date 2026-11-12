import { useCallback } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { NavSection } from '@layout'
import { useKeyboardShortcut } from '@shared'
import {
  activeNavAtom,
  problemsAtom,
  categoriesAtom,
  marathonStepsAtom,
  marathonsAtom,
  isViewingAllMarathonsAtom,
  isSolvingChallengeAtom,
  activeCategoryAtom,
  activeProblemsAtom,
  selectedProblemIdAtom,
  isSidebarOpenAtom,
  toggleSidebarAtom,
  solveProblemAtom,
  selectCategoryAtom,
  openChallengeAtom,
  backToCategoryListAtom,
  closeCategoryAtom,
  navigateSectionAtom,
  viewAllMarathonsAtom,
  generateCategoryAtom,
} from '@/shared/store'

/**
 * Top-level workspace state orchestrator backed by Jotai global state atoms.
 * Coordinates navigation, categories, problems, and cross-feature transitions.
 */
export function useAppWorkspace() {
  const [activeNav] = useAtom(activeNavAtom)
  const [problems] = useAtom(problemsAtom)
  const [categories] = useAtom(categoriesAtom)
  const [marathonSteps] = useAtom(marathonStepsAtom)
  const [marathons] = useAtom(marathonsAtom)
  const [isViewingAllMarathons] = useAtom(isViewingAllMarathonsAtom)
  const [isSolvingChallenge] = useAtom(isSolvingChallengeAtom)
  const [activeCategory] = useAtom(activeCategoryAtom)
  const activeProblems = useAtomValue(activeProblemsAtom)
  const [selectedProblemId, setSelectedProblemId] = useAtom(selectedProblemIdAtom)
  const [isSidebarOpen, setIsSidebarOpen] = useAtom(isSidebarOpenAtom)

  const toggleSidebarAction = useSetAtom(toggleSidebarAtom)
  const solveProblem = useSetAtom(solveProblemAtom)
  const selectCategory = useSetAtom(selectCategoryAtom)
  const openChallengeAction = useSetAtom(openChallengeAtom)
  const backToCategoryListAction = useSetAtom(backToCategoryListAtom)
  const closeCategoryAction = useSetAtom(closeCategoryAtom)
  const navigateSectionAction = useSetAtom(navigateSectionAtom)
  const viewAllMarathonsAction = useSetAtom(viewAllMarathonsAtom)
  const generateCategory = useSetAtom(generateCategoryAtom)

  const toggleSidebar = useCallback(() => {
    toggleSidebarAction()
  }, [toggleSidebarAction])

  useKeyboardShortcut('b', toggleSidebar)

  const handleSolveProblem = (problemId: number) => {
    solveProblem(problemId)
  }

  const handleSelectCategory = (catName: string, isMarathon = false) => {
    selectCategory({ name: catName, isMarathon, startSolving: false })
  }

  const handleOpenChallenge = (problemId: number) => {
    openChallengeAction(problemId)
  }

  const handleBackToCategoryList = () => {
    backToCategoryListAction()
  }

  const handleViewAllMarathons = () => {
    viewAllMarathonsAction()
  }

  const handleGenerateCategory = (prompt: string) => {
    generateCategory(prompt)
  }

  const handleNavChange = (nav: NavSection) => {
    navigateSectionAction(nav)
  }

  const returnHome = () => {
    navigateSectionAction('home')
  }

  const closeCategory = () => {
    closeCategoryAction()
  }

  return {
    activeNav,
    problems,
    categories,
    marathonSteps,
    marathons,
    isViewingAllMarathons,
    isSolvingChallenge,
    activeCategory,
    activeProblems,
    selectedProblemId,
    isSidebarOpen,
    setSelectedProblemId,
    setIsSidebarOpen,
    toggleSidebar,
    handleSolveProblem,
    handleSelectCategory,
    handleOpenChallenge,
    handleBackToCategoryList,
    handleViewAllMarathons,
    handleGenerateCategory,
    handleNavChange,
    returnHome,
    closeCategory,
  }
}
