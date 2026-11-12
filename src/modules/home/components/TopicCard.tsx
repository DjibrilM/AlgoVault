import { Layers, Code2, Cpu, Calculator, CheckCircle2, ChevronRight } from 'lucide-react'
import { TopicCardProps } from '../types'

export function TopicCard({ category, problems, onSelect }: TopicCardProps) {
  const catProblems = problems.filter((p) => category.problemIds.includes(p.id))
  const solvedCount = catProblems.filter((p) => p.solved).length

  return (
    <div
      onClick={onSelect}
      className="group relative rounded-2xl border border-[#262626] bg-[#141414] p-5 hover:border-[#6366F1]/50 hover:bg-[#1C1C1C] transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between space-y-4"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-9 w-9 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/30 flex items-center justify-center text-[#6366F1]">
            {category.name.includes('Arithmetic') ? (
              <Calculator className="h-4 w-4" />
            ) : category.name.includes('Data') ? (
              <Layers className="h-4 w-4" />
            ) : category.name.includes('Algo') ? (
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
            {category.name}
          </h3>
          {category.description && (
            <p className="text-[11px] text-[#A3A3A3] mt-1 leading-snug line-clamp-2">
              {category.description}
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
}
