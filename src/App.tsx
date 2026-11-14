import { AppLayout } from '@layout'
import { ChallengeSidebar, ChallengeWorkspace } from '@modules/challenge'
import { HomeScreen, MarathonListScreen, CategoryProblemsScreen } from '@modules/home'
import { QuestionsFactoryScreen } from './modules/questions-factory'
import { FavoritesScreen } from './modules/favorites'
import { SettingsScreen } from '@modules/settings'
import { TodosScreen } from '@modules/todos'
import { useAppWorkspace } from './app/useAppWorkspace'

export function App() {
  const {
    activeNav,
    problems,
    categories,
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
    handleNavChange,
    returnHome,
    closeCategory,
  } = useAppWorkspace()

  const renderScene = () => {
    switch (activeNav) {
      case 'home':
        // 1. Conversational Questions Factory screen
        if (isViewingAiStudio) {
          return <QuestionsFactoryScreen onBackToHome={returnHome} />
        }

        // 2. All Marathons dedicated screen
        if (isViewingAllMarathons) {
          return (
            <MarathonListScreen
              marathons={marathons}
              onSelectMarathon={(marathon) => handleSelectCategory(marathon.title, true)}
              onBackToHome={returnHome}
            />
          )
        }

        // 2. Active Category / Marathon selected
        if (activeCategory) {
          // A: If user hasn't clicked a challenge yet, show the Category Challenges list screen
          if (!isSolvingChallenge) {
            return (
              <CategoryProblemsScreen
                category={activeCategory}
                problems={activeProblems}
                onSelectProblem={handleOpenChallenge}
                onBack={closeCategory}
              />
            )
          }

          // B: Once user clicks a challenge, show the Challenge workspace with runner & code editor
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
        }

        // 3. Main Home screen (Carousel of marathons + topic collections)
        return (
          <HomeScreen
            categories={categories}
            marathons={marathons}
            problems={problems}
            onSelectCategory={handleSelectCategory}
            onSelectMarathon={(marathon) => handleSelectCategory(marathon.title, true)}
            onViewAllMarathons={handleViewAllMarathons}
            onOpenAiStudio={handleOpenAiStudio}
          />
        )

      case 'settings':
        return <SettingsScreen onReturnHome={returnHome} />

      case 'favorites':
        return <FavoritesScreen onReturnHome={returnHome} />

      case 'todos':
        return <TodosScreen onReturnHome={returnHome} />

      default:
        return null
    }
  }

  // Sidebar is only shown when actively solving inside ChallengeWorkspace
  const secondarySidebar =
    activeNav === 'home' && activeCategory && isSolvingChallenge && isSidebarOpen ? (
      <ChallengeSidebar
        categoryTitle={activeCategory.name}
        isMarathon={activeCategory.isMarathon}
        problems={activeProblems}
        selectedProblemId={selectedProblemId}
        onSelectProblem={setSelectedProblemId}
        onBackToHome={handleBackToCategoryList}
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
