import { useCallback, useEffect } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { NavSection } from '@layout'
import { type AppMenuAction, useAppMenuAction, useKeyboardShortcut } from '@shared'
import { useWorkspaceQuery } from '@/shared/hooks/useWorkspaceQueries'
import {
  activeNavAtom,
  problemsAtom,
  categoriesAtom,
  submissionsAtom,
  workspaceLoadedAtom,
  marathonStepsAtom,
  marathonsAtom,
  isViewingAllMarathonsAtom,
  isViewingAiStudioAtom,
  isSolvingChallengeAtom,
  activeCategoryAtom,
  activeProblemsAtom,
  selectedProblemIdAtom,
  isSidebarOpenAtom,
  canGoBackAtom,
  canGoForwardAtom,
  goBackAtom,
  goForwardAtom,
  toggleSidebarAtom,
  solveProblemAtom,
  selectCategoryAtom,
  openChallengeAtom,
  backToCategoryListAtom,
  closeCategoryAtom,
  navigateSectionAtom,
  viewAllMarathonsAtom,
  openAiStudioAtom,
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
  const [isViewingAiStudio] = useAtom(isViewingAiStudioAtom)
  const [isSolvingChallenge] = useAtom(isSolvingChallengeAtom)
  const [activeCategory] = useAtom(activeCategoryAtom)
  const activeProblems = useAtomValue(activeProblemsAtom)
  const [selectedProblemId, setSelectedProblemId] = useAtom(selectedProblemIdAtom)
  const [isSidebarOpen, setIsSidebarOpen] = useAtom(isSidebarOpenAtom)
  const canGoBack = useAtomValue(canGoBackAtom)
  const canGoForward = useAtomValue(canGoForwardAtom)

  const goBackAction = useSetAtom(goBackAtom)
  const goForwardAction = useSetAtom(goForwardAtom)
  const toggleSidebarAction = useSetAtom(toggleSidebarAtom)
  const solveProblem = useSetAtom(solveProblemAtom)
  const selectCategory = useSetAtom(selectCategoryAtom)
  const openChallengeAction = useSetAtom(openChallengeAtom)
  const backToCategoryListAction = useSetAtom(backToCategoryListAtom)
  const closeCategoryAction = useSetAtom(closeCategoryAtom)
  const navigateSectionAction = useSetAtom(navigateSectionAtom)
  const viewAllMarathonsAction = useSetAtom(viewAllMarathonsAtom)
  const openAiStudioAction = useSetAtom(openAiStudioAtom)
  const generateCategory = useSetAtom(generateCategoryAtom)
  const setCategories = useSetAtom(categoriesAtom)
  const setProblems = useSetAtom(problemsAtom)
  const setSubmissions = useSetAtom(submissionsAtom)
  const setWorkspaceLoaded = useSetAtom(workspaceLoadedAtom)
  const { data: workspaceData } = useWorkspaceQuery()

  useEffect(() => {
    if (!workspaceData) return
    setCategories(workspaceData.categories)
    setProblems(workspaceData.problems)
    setSubmissions(workspaceData.submissions)
    setWorkspaceLoaded(true)

    if (
      workspaceData.problems.length > 0 &&
      !workspaceData.problems.some((p) => p.id === selectedProblemId)
    ) {
      setSelectedProblemId(workspaceData.problems[0].id)
    }
  }, [
    workspaceData,
    selectedProblemId,
    setCategories,
    setProblems,
    setSubmissions,
    setWorkspaceLoaded,
    setSelectedProblemId,
  ])

  const toggleSidebar = useCallback(() => {
    toggleSidebarAction()
  }, [toggleSidebarAction])

  const hasNativeMenu = typeof window !== 'undefined' && Boolean(window.appMenu)
  useKeyboardShortcut('b', toggleSidebar, !hasNativeMenu)

  const isChallengeActive = activeNav === 'home' && Boolean(activeCategory) && isSolvingChallenge
  const activeProblemIndex = activeProblems.findIndex((p) => p.id === selectedProblemId)
  const canPrevChallenge = isChallengeActive && activeProblemIndex > 0
  const canNextChallenge =
    isChallengeActive && activeProblemIndex !== -1 && activeProblemIndex < activeProblems.length - 1

  useEffect(() => {
    window.appMenu?.syncState({
      canGoBack,
      canGoForward,
      isSolvingChallenge: isChallengeActive,
      canPrevChallenge,
      canNextChallenge,
      ...(isChallengeActive ? {} : { isRunning: false }),
    })
  }, [canGoBack, canGoForward, isChallengeActive, canPrevChallenge, canNextChallenge])

  useAppMenuAction((action) => {
    const handlers: Partial<Record<AppMenuAction, () => void>> = {
      'nav-home': () => navigateSectionAction('home'),
      'open-questions-factory': openAiStudioAction,
      'new-questions-studio': openAiStudioAction,
      'open-marathons': viewAllMarathonsAction,
      'nav-favorites': () => navigateSectionAction('favorites'),
      'nav-todos': () => navigateSectionAction('todos'),
      'open-settings': () => navigateSectionAction('settings'),
      'nav-back': goBackAction,
      'nav-forward': goForwardAction,
      'toggle-sidebar': toggleSidebarAction,
    }
    handlers[action]?.()
  })

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

  const handleOpenAiStudio = () => {
    openAiStudioAction()
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
    isViewingAiStudio,
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
    handleOpenAiStudio,
    handleGenerateCategory,
    handleNavChange,
    returnHome,
    closeCategory,
  }
}
