import { useAtomValue, useSetAtom } from 'jotai'
import { HomeScreenProps } from '../types'
import { AiGeneratorBar } from '../components/AiGeneratorBar'
import { MarathonCarousel } from '../components/MarathonCarousel'
import { TopicCard } from '../components/TopicCard'
import {
  categoriesAtom,
  marathonsAtom,
  problemsAtom,
  selectCategoryAtom,
  viewAllMarathonsAtom,
  generateCategoryAtom,
} from '@/shared/store'
import { MarathonTrack } from '@/shared/types/problem'

export function HomeScreen({
  categories: propCategories,
  marathons: propMarathons,
  problems: propProblems,
  onSelectCategory: propOnSelectCategory,
  onSelectMarathon: propOnSelectMarathon,
  onViewAllMarathons: propOnViewAllMarathons,
  onGenerateCategory: propOnGenerateCategory,
}: HomeScreenProps) {
  // Global Jotai fallbacks
  const globalCategories = useAtomValue(categoriesAtom)
  const globalMarathons = useAtomValue(marathonsAtom)
  const globalProblems = useAtomValue(problemsAtom)
  const globalSelectCategory = useSetAtom(selectCategoryAtom)
  const globalViewAllMarathons = useSetAtom(viewAllMarathonsAtom)
  const globalGenerateCategory = useSetAtom(generateCategoryAtom)

  const categories = propCategories ?? globalCategories
  const marathons = propMarathons ?? globalMarathons
  const problems = propProblems ?? globalProblems

  const handleSelect = (categoryName: string, isMarathon = false) => {
    if (propOnSelectCategory) {
      propOnSelectCategory(categoryName, isMarathon)
    } else {
      globalSelectCategory({ name: categoryName, isMarathon, startSolving: false })
    }
  }

  const handleSelectMarathon = (marathon: MarathonTrack) => {
    if (propOnSelectMarathon) {
      propOnSelectMarathon(marathon)
    } else {
      globalSelectCategory({ name: marathon.title, isMarathon: true, startSolving: false })
    }
  }

  const handleViewAll = () => {
    if (propOnViewAllMarathons) {
      propOnViewAllMarathons()
    } else {
      globalViewAllMarathons()
    }
  }

  const handleGenerate = (prompt: string) => {
    if (propOnGenerateCategory) {
      propOnGenerateCategory(prompt)
    } else {
      globalGenerateCategory(prompt)
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#1A1A1A] text-[#E5E5E5] overflow-y-auto select-none p-8 space-y-8 scrollbar-thin">
      {/* Top Banner & AI Generator */}
      <div className="max-w-5xl mx-auto w-full space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>AlgoVault</span>
          </h1>
          <p className="text-xs text-[#8C8C8C]">
            Select a practice category or enter Marathon mode to start solving challenges.
          </p>
        </div>

        <AiGeneratorBar onSubmit={handleGenerate} />
      </div>

      <div className="max-w-5xl mx-auto w-full space-y-8">
        {/* 1. Sequential Tracks Carousel (Marathon Mode) */}
        <MarathonCarousel
          marathons={marathons}
          onSelectMarathon={handleSelectMarathon}
          onViewAll={handleViewAll}
        />

        {/* 2. Topic Collections */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white tracking-wide uppercase">
              Topic Collections
            </span>
            <span className="text-xs text-[#737373]">
              Practice at your own pace
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <TopicCard
                key={cat.id}
                category={cat}
                problems={problems}
                onSelect={() => handleSelect(cat.name, false)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomeScreen
