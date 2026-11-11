import { useState } from 'react'
import {
  Flame,
  Layers,
  Wand2,
  ChevronRight,
  Code2,
  Cpu,
  CheckCircle2,
} from 'lucide-react'
import { AICategory, Problem, MarathonStep } from '../challenge/mockData'

interface HomeScreenProps {
  categories: AICategory[]
  marathonSteps: MarathonStep[]
  problems: Problem[]
  onSelectCategory: (categoryName: string, isMarathon?: boolean) => void
  onGenerateCategory: (prompt: string) => void
}

export function HomeScreen({
  categories,
  marathonSteps,
  problems,
  onSelectCategory,
  onGenerateCategory,
}: HomeScreenProps) {
  const [aiPrompt, setAiPrompt] = useState('')

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiPrompt.trim()) return
    onGenerateCategory(aiPrompt.trim())
    setAiPrompt('')
  }

  const completedMarathon = marathonSteps.filter((s) => s.completed).length

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

        {/* AI Quick Generator Bar */}
        <form
          onSubmit={handleAiSubmit}
          className="relative flex items-center gap-2 p-1.5 rounded-2xl bg-[#141414] border border-[#2E2E2E] shadow-lg focus-within:border-[#6366F1] transition-all"
        >
          <div className="pl-3 text-[#6366F1]">
            <Wand2 className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Ask AI to generate a question set (e.g. '5 questions on Graph Traversal and BFS')..."
            className="flex-1 h-9 bg-transparent text-xs text-white placeholder:text-[#525252] outline-none"
          />
          <button
            type="submit"
            className="px-4 h-9 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Wand2 className="h-3.5 w-3.5" />
            <span>Generate</span>
          </button>
        </form>
      </div>

      <div className="max-w-4xl mx-auto w-full space-y-8">
        {/* ========================================================================= */}
        {/* 1. MARATHON MODE CARD                                                     */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8C8C8C] uppercase tracking-wider">
              Sequential Tracks
            </span>
          </div>

          <div
            onClick={() => onSelectCategory('Marathon Mode', true)}
            className="group relative rounded-2xl border border-[#F59E0B]/30 bg-gradient-to-br from-[#1F1B14] to-[#171410] p-6 hover:border-[#F59E0B]/60 transition-all cursor-pointer shadow-lg hover:shadow-xl"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B]">
                    <Flame className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white group-hover:text-[#F59E0B] transition-colors">
                      Marathon Mode
                    </h2>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30">
                    Easiest → Hardest
                  </span>
                </div>

                <p className="text-xs text-[#A3A3A3] max-w-xl leading-relaxed">
                  The system presents challenges in strict progression. You must complete the current step before unlocking the next milestone.
                </p>

                {/* Progress bar */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-48 bg-[#262626] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#F59E0B] to-[#10B981] h-full"
                      style={{
                        width: `${Math.round(
                          (completedMarathon / marathonSteps.length) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-[#F59E0B] font-semibold">
                    Step {completedMarathon + 1} of {marathonSteps.length} Unlocked
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  <span>Enter Marathon</span>
                  <ChevronRight className="h-4 w-4 text-[#F59E0B]" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. TOPIC CATEGORIES (Freeform - Do what you feel like doing)              */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8C8C8C] uppercase tracking-wider">
              Topic Collections (Practice at your own pace)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const catProblems = problems.filter((p) =>
                cat.problemIds.includes(p.id)
              )
              const solvedCount = catProblems.filter((p) => p.solved).length

              return (
                <div
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.name, false)}
                  className="group relative rounded-2xl border border-[#262626] bg-[#141414] p-5 hover:border-[#6366F1]/50 hover:bg-[#1C1C1C] transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="h-9 w-9 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/30 flex items-center justify-center text-[#6366F1]">
                        {cat.name.includes('Data') ? (
                          <Layers className="h-4 w-4" />
                        ) : cat.name.includes('Algo') ? (
                          <Code2 className="h-4 w-4" />
                        ) : (
                          <Cpu className="h-4 w-4" />
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-[#737373]">
                        {catProblems.length} challenges
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-white group-hover:text-[#6366F1] transition-colors">
                        {cat.name}
                      </h3>
                      {cat.description && (
                        <p className="text-[11px] text-[#A3A3A3] mt-1 leading-snug line-clamp-2">
                          {cat.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#262626] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#10B981]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{solvedCount} / {catProblems.length} Solved</span>
                    </div>
                    <span className="text-[#6366F1] group-hover:translate-x-1 transition-transform">
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomeScreen
