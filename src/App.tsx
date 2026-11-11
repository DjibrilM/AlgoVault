import { useState, useEffect } from 'react'
import { AppLayout } from './layout/AppLayout'
import { NavSection } from './layout/types'
import { HomeScreen } from './screens/home/HomeScreen'
import { ChallengeWorkspace } from './screens/challenge/ChallengeScreen'
import { ChallengeSidebar } from './screens/challenge/ChallengeSidebar'
import {
  INITIAL_PROBLEMS,
  INITIAL_MARATHON_STEPS,
  INITIAL_AI_CATEGORIES,
  Problem,
  AICategory,
} from './screens/challenge/mockData'
import { Settings, Clock, CheckSquare } from 'lucide-react'

export function App() {
  const [activeNav, setActiveNav] = useState<NavSection>('home')
  const [problems, setProblems] = useState<Problem[]>(INITIAL_PROBLEMS)
  const [categories, setCategories] = useState<AICategory[]>(INITIAL_AI_CATEGORIES)
  const [marathonSteps, setMarathonSteps] = useState(INITIAL_MARATHON_STEPS)

  // Current active challenge category: null = Home Page; non-null = Challenge Screen
  const [activeCategory, setActiveCategory] = useState<{
    name: string
    isMarathon: boolean
  } | null>(null)

  const [selectedProblemId, setSelectedProblemId] = useState<number>(1)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Global keyboard shortcut (Cmd+B / Ctrl+B) to toggle challenge sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        setIsSidebarOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Mark problem solved & unlock next marathon step if applicable
  const handleSolveProblem = (problemId: number) => {
    setProblems((prev) =>
      prev.map((p) => (p.id === problemId ? { ...p, solved: true } : p))
    )
    setMarathonSteps((prev) => {
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

  // Get problems for a specific category
  const getCategoryProblemsList = (catName: string, isMarathon: boolean): Problem[] => {
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

  // Handle category selection from Home Page
  const handleSelectCategory = (catName: string, isMarathon = false) => {
    setActiveCategory({ name: catName, isMarathon })
    setIsSidebarOpen(true)
    const catProblems = getCategoryProblemsList(catName, isMarathon)
    if (catProblems.length > 0) {
      setSelectedProblemId(catProblems[0].id)
    }
  }

  // Handle AI category generation from Home Page
  const handleGenerateCategory = (prompt: string) => {
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
        description: `### ${newCategoryName} (Part 1)\n\nGiven the requirements in your prompt: "${prompt}", implement an optimal solution.`,
        examples: [{ id: 1, input: 'n = 5', output: 'true' }],
        constraints: ['1 <= n <= 10^5'],
        hints: ['Consider baseline constraints.'],
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
        description: `### ${newCategoryName} (Part 2 - Optimization)\n\nOptimize your solution for maximum throughput.`,
        examples: [{ id: 1, input: 'arr = [1, 2, 3]', output: '6' }],
        constraints: ['1 <= arr.length <= 10^5'],
        hints: ['Use hashing or memoization.'],
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

    setProblems((prev) => [...generatedProblems, ...prev])

    const newCat: AICategory = {
      id: `cat-${newId}`,
      name: newCategoryName,
      description: `AI Collection generated from prompt: "${prompt}"`,
      isCustom: true,
      problemIds: generatedProblems.map((p) => p.id),
    }

    setCategories((prev) => [newCat, ...prev])

    // Immediately open Challenge Screen for this newly generated category
    setActiveCategory({ name: newCategoryName, isMarathon: false })
    setSelectedProblemId(newId)
  }

  // Active category problems list
  const activeProblems = activeCategory
    ? getCategoryProblemsList(activeCategory.name, activeCategory.isMarathon)
    : []

  // Main canvas scene
  const renderScene = () => {
    switch (activeNav) {
      case 'home':
        if (!activeCategory) {
          // Home Screen: lists all categories (NO secondary sidebar)
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

        // Challenge Screen: workspace canvas
        return (
          <ChallengeWorkspace
            problems={activeProblems}
            selectedProblemId={selectedProblemId}
            onSelectProblem={setSelectedProblemId}
            onSolveProblem={handleSolveProblem}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          />
        )

      case 'settings':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#1A1A1A]">
            <div className="h-16 w-16 rounded-2xl bg-[#222222] border border-[#2E2E2E] flex items-center justify-center text-[#6366F1] mb-4 shadow-lg">
              <Settings className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">AlgoVault Settings</h2>
            <p className="text-sm text-[#A3A3A3] max-w-md mt-2">
              Configure your self-hosted judge environment, compiler flags, and theme preferences.
            </p>
            <button
              onClick={() => {
                setActiveNav('home')
                setActiveCategory(null)
              }}
              className="mt-6 px-4 py-2 rounded-xl bg-[#6366F1] text-white text-xs font-semibold hover:bg-[#4F46E5] transition-all cursor-pointer"
            >
              Return to Home
            </button>
          </div>
        )

      case 'history':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#1A1A1A]">
            <div className="h-16 w-16 rounded-2xl bg-[#222222] border border-[#2E2E2E] flex items-center justify-center text-[#10B981] mb-4 shadow-lg">
              <Clock className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Submissions History</h2>
            <p className="text-sm text-[#A3A3A3] max-w-md mt-2">
              Audit trail of past runs, execution times, memory graphs, and benchmark percentiles.
            </p>
            <button
              onClick={() => {
                setActiveNav('home')
                setActiveCategory(null)
              }}
              className="mt-6 px-4 py-2 rounded-xl bg-[#6366F1] text-white text-xs font-semibold hover:bg-[#4F46E5] transition-all cursor-pointer"
            >
              Return to Home
            </button>
          </div>
        )

      case 'todos':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#1A1A1A]">
            <div className="h-16 w-16 rounded-2xl bg-[#222222] border border-[#2E2E2E] flex items-center justify-center text-[#F59E0B] mb-4 shadow-lg">
              <CheckSquare className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">To-dos & Bookmarks</h2>
            <p className="text-sm text-[#A3A3A3] max-w-md mt-2">
              Your targeted practice queue. Star problems to add them to this list.
            </p>
            <button
              onClick={() => {
                setActiveNav('home')
                setActiveCategory(null)
              }}
              className="mt-6 px-4 py-2 rounded-xl bg-[#6366F1] text-white text-xs font-semibold hover:bg-[#4F46E5] transition-all cursor-pointer"
            >
              Return to Home
            </button>
          </div>
        )

      default:
        return null
    }
  }

  // The secondary sidebar: ONLY present when activeNav is 'home' AND a category is opened AND sidebar is open!
  const secondarySidebar =
    activeNav === 'home' && activeCategory && isSidebarOpen ? (
      <ChallengeSidebar
        categoryTitle={activeCategory.name}
        isMarathon={activeCategory.isMarathon}
        problems={activeProblems}
        selectedProblemId={selectedProblemId}
        onSelectProblem={setSelectedProblemId}
        onBackToHome={() => setActiveCategory(null)}
        onClose={() => setIsSidebarOpen(false)}
      />
    ) : null

  return (
    <AppLayout
      activeNav={activeNav}
      onNavChange={(nav) => {
        setActiveNav(nav)
        if (nav === 'home') {
          setActiveCategory(null) // Return to category overview
        }
      }}
      secondarySidebar={secondarySidebar}
    >
      {renderScene()}
    </AppLayout>
  )
}

export default App
