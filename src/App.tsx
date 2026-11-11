import { AppLayout } from '@layout'
import { ChallengeSidebar, ChallengeWorkspace } from '@modules/challenge'
import { HomeScreen } from '@modules/home'
import { HistoryScreen } from '@modules/history'
import { SettingsScreen } from '@modules/settings'
import { TodosScreen } from '@modules/todos'
import { useAppWorkspace } from './app/useAppWorkspace'

export function App() {
  const {
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
  } = useAppWorkspace()

  const renderScene = () => {
    switch (activeNav) {
      case 'home':
        if (!activeCategory) {
          return (
            <HomeScreen
              categories={categories}
              marathonSteps={marathonSteps}
              problems={problems}
              onSelectCategory={handleSelectCategory}
              onGenerateCategory={handleGenerateCategory}
            />
          )
        }

        return (
          <ChallengeWorkspace
            problems={activeProblems}
            selectedProblemId={selectedProblemId}
            onSelectProblem={setSelectedProblemId}
            onSolveProblem={handleSolveProblem}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={toggleSidebar}
          />
        )

      case 'settings':
        return <SettingsScreen onReturnHome={returnHome} />

      case 'history':
        return <HistoryScreen onReturnHome={returnHome} />

      case 'todos':
        return <TodosScreen onReturnHome={returnHome} />

      default:
        return null
    }
  }

  const secondarySidebar =
    activeNav === 'home' && activeCategory && isSidebarOpen ? (
      <ChallengeSidebar
        categoryTitle={activeCategory.name}
        isMarathon={activeCategory.isMarathon}
        problems={activeProblems}
        selectedProblemId={selectedProblemId}
        onSelectProblem={setSelectedProblemId}
        onBackToHome={closeCategory}
        onClose={() => setIsSidebarOpen(false)}
      />
    ) : null

  return (
    <AppLayout
      activeNav={activeNav}
      onNavChange={handleNavChange}
      secondarySidebar={secondarySidebar}
    >
      {renderScene()}
    </AppLayout>
  )
}

export default App
