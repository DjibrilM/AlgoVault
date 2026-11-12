import { useState, useMemo } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Search,
  ChevronRight,
  Layers,
  Code2,
  Cpu,
  Calculator,
} from 'lucide-react'
import { AICategory, Problem, Difficulty } from '@/shared/types/problem'
import { getCategoryCoverUrl, getMarathonCoverUrl } from '@/shared/utils/coverImages'
import { INITIAL_MARATHONS } from '@/shared/data/tracks/marathonData'
import { challengeService } from '@/modules/challenge/services/challengeService'
import { cn } from '@/lib/utils'

import mountainImg from '@/assets/images/marathons/mountain-flag.png'

interface CategoryProblemsScreenProps {
  category: AICategory | { name: string; isMarathon?: boolean }
  problems: Problem[]
  onSelectProblem: (problemId: number) => void
  onBack: () => void
}

export function CategoryProblemsScreen({
  category,
  problems,
  onSelectProblem,
  onBack,
}: CategoryProblemsScreenProps) {
  const [search, setSearch] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')

  const catName = category.name
  const isMarathon = 'isMarathon' in category && Boolean(category.isMarathon)
  const matchedMarathon = isMarathon
    ? INITIAL_MARATHONS.find((m) => m.title.toLowerCase() === catName.toLowerCase())
    : undefined
  const catId = 'id' in category ? category.id : catName.toLowerCase().replace(/\s+/g, '-')
  const coverUrl = matchedMarathon
    ? getMarathonCoverUrl(matchedMarathon.coverIndex)
    : getCategoryCoverUrl(catId)
  const descriptionText =
    'description' in category && category.description
      ? category.description
      : matchedMarathon?.description || matchedMarathon?.subtitle

  const solvedCount = problems.filter((p) => p.solved).length
  const totalCount = problems.length

  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
        String(p.id).includes(search)
      const matchesDiff =
        selectedDifficulty === 'all' || p.difficulty.toLowerCase() === selectedDifficulty.toLowerCase()
      return matchesSearch && matchesDiff
    })
  }, [problems, search, selectedDifficulty])

  const getCategoryIcon = () => {
    if (isMarathon) {
      return (
        <img
          src={mountainImg}
          alt="Marathon"
          className="h-7 w-7 object-contain drop-shadow-md"
        />
      )
    }
    if (catName.includes('Arithmetic')) return <Calculator className="h-5 w-5 text-white" />
    if (catName.includes('Data')) return <Layers className="h-5 w-5 text-white" />
    if (catName.includes('Algo')) return <Code2 className="h-5 w-5 text-white" />
    return <Cpu className="h-5 w-5 text-white" />
  }

  return (
    <div className="h-full flex flex-col bg-[#1A1A1A] text-[#E5E5E5] overflow-y-auto select-none scrollbar-thin">
      {/* 1. Category / Marathon Cover Hero Header (NO border beneath cover banner) */}
      <div className="relative w-full min-h-55 bg-[#111111] shrink-0 overflow-hidden">
        {/* Cover image or gradient background */}
        {coverUrl && (
          <img
            src={coverUrl}
            alt={catName}
            className="absolute inset-0 w-full h-full object-cover object-center z-0 opacity-80"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-[#1A1A1A] via-black/50 to-black/20 z-10" />

        <div className="relative z-20 h-full max-w-5xl mx-auto px-8 py-6 flex flex-col justify-between">
          {/* Back button */}
          <div>
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white transition-colors cursor-pointer px-3 py-2 rounded-lg bg-black/50 backdrop-blur-md"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-white" />
              <span>{isMarathon ? 'Back to Marathons' : 'Back to Categories'}</span>
            </button>
          </div>

          {/* Title, description & Mountain Illustration for Marathon */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-3">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-black/60 backdrop-blur-md flex items-center justify-center text-white shadow-lg">
                  {getCategoryIcon()}
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  {catName}
                </h1>
              </div>
              {descriptionText && (
                <p className="text-xs text-[#D4D4D4] leading-relaxed">
                  {descriptionText}
                </p>
              )}
            </div>

            {/* Right Side: Progress Pill */}
            <div className="flex items-center gap-4 shrink-0">
              {/* Progress Pill */}
              <div className="px-4 py-2.5 rounded-xl bg-black/60 backdrop-blur-md flex items-center gap-3 shadow-lg">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-white/70 uppercase tracking-wider font-semibold">
                    Solved
                  </div>
                  <div className="text-sm font-bold text-white font-mono">
                    {solvedCount} / {totalCount}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Controls: Search & Difficulty Filters */}
      <div className="max-w-5xl mx-auto w-full px-8 pt-6 pb-2 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search bar inside category */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#737373]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search challenges by title, ID or tag..."
              className="w-full h-8 pl-8 pr-3 text-xs rounded-lg bg-[#1C1C1C] border border-[#2E2E2E] focus:border-white/30 text-white placeholder:text-[#666666] outline-none transition-all"
            />
          </div>

          {/* Difficulty Filter Pills */}
          <div className="flex items-center gap-1.5">
            {['all', 'Easy', 'Medium', 'Hard'].map((diff) => {
              const active = selectedDifficulty.toLowerCase() === diff.toLowerCase()
              return (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={cn(
                    'text-xs px-3 py-1 rounded-lg transition-all cursor-pointer font-medium',
                    {
                      'bg-white text-black font-semibold': active,
                      'bg-[#1C1C1C] text-[#8C8C8C] hover:text-white border border-[#2B2B2B]': !active,
                    }
                  )}
                >
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </button>
              )
            })}
          </div>
        </div>

        {/* 3. Challenge Rows List */}
        <div className="space-y-2 pt-2 pb-12">
          {filteredProblems.length === 0 ? (
            <div className="py-16 text-center text-[#737373] text-xs space-y-2 border border-dashed border-[#262626] rounded-xl">
              <p>No challenges found matching your search filter.</p>
            </div>
          ) : (
            filteredProblems.map((problem) => {
              return (
                <div
                  key={problem.id}
                  onClick={() => onSelectProblem(problem.id)}
                  className="group flex items-center justify-between p-3.5 rounded-xl border border-white/[0.04] bg-[#202020] hover:border-white/[0.12] hover:bg-[#252525] transition-all cursor-pointer"
                >
                  {/* Left: Status & Title */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0">
                      {problem.solved ? (
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      ) : (
                        <Circle className="h-4 w-4 text-[#525252] group-hover:text-white/60 transition-colors" />
                      )}
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white group-hover:text-white truncate">
                          {problem.title}
                        </span>
                        <span className="text-[10px] font-mono text-[#737373]">
                          #{problem.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-[#737373]">
                        <span>Acceptance {problem.acceptance}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          {problem.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.2 rounded bg-white/5 text-white/70 text-[10px]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Difficulty badge & Solve Button */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={cn(
                        'text-[10px] font-medium px-2 py-0.5 rounded border',
                        challengeService.getDifficultyBadge(problem.difficulty as Difficulty)
                      )}
                    >
                      {problem.difficulty}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectProblem(problem.id)
                      }}
                      className="px-3 py-1 rounded-md text-xs font-semibold text-white bg-white/10 hover:bg-white hover:text-black transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>{problem.solved ? 'Review' : 'Solve'}</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default CategoryProblemsScreen
