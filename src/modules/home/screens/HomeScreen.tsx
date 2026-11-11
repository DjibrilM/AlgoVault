import { useAtomValue, useSetAtom } from 'jotai'
import { HomeScreenProps } from '../types'
import { AiGeneratorBar } from '../components/AiGeneratorBar'
import { MarathonCard } from '../components/MarathonCard'
import { TopicCard } from '../components/TopicCard'
import {
  categoriesAtom,
  marathonStepsAtom,
  problemsAtom,
  selectCategoryAtom,
  generateCategoryAtom,
} from '@/shared/store'

export function HomeScreen({
  categories: propCategories,
  marathonSteps: propMarathonSteps,
  problems: propProblems,
  onSelectCategory: propOnSelectCategory,
  onGenerateCategory: propOnGenerateCategory,
}: HomeScreenProps) {
  // Global Jotai fallbacks
  const globalCategories = useAtomValue(categoriesAtom)
  const globalMarathonSteps = useAtomValue(marathonStepsAtom)
  const globalProblems = useAtomValue(problemsAtom)
  const globalSelectCategory = useSetAtom(selectCategoryAtom)
  const globalGenerateCategory = useSetAtom(generateCategoryAtom)

  const categories = propCategories ?? globalCategories
  const marathonSteps = propMarathonSteps ?? globalMarathonSteps
  const problems = propProblems ?? globalProblems

  const handleSelect = (categoryName: string, isMarathon = false) => {
    if (propOnSelectCategory) {
      propOnSelectCategory(categoryName, isMarathon)
    } else {
      globalSelectCategory({ name: categoryName, isMarathon })
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
      <div className="max-w-4xl mx-auto w-full space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>AlgoVault</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/30">
              v1.0
            </span>
          </h1>
          <p className="text-xs text-[#A3A3A3]">
            Select a practice category or enter Marathon mode to start solving challenges.
          </p>
        </div>

        <AiGeneratorBar onSubmit={handleGenerate} />
      </div>

      <div className="max-w-4xl mx-auto w-full space-y-8">
        {/* 1. Sequential Tracks (Marathon Mode) */}
        <MarathonCard
          marathonSteps={marathonSteps}
          onSelect={() => handleSelect('Marathon Mode', true)}
        />

        {/* 2. Topic Collections */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8C8C8C] uppercase tracking-wider">
              Topic Collections (Practice at your own pace)
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
