import { Layers, Code2, Cpu, Calculator, CheckCircle2, ChevronRight } from 'lucide-react'
import { TopicCardProps } from '../types'

export function TopicCard({ category, problems, onSelect }: TopicCardProps) {
  const catProblems = problems.filter((p) => category.problemIds.includes(p.id))
  const solvedCount = catProblems.filter((p) => p.solved).length

  return (
    <div
      onClick={onSelect}
      className="group relative rounded-xl border border-white/[0.04] hover:border-white/[0.08] bg-[#202020] hover:bg-[#252525] transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between p-5 space-y-4"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          {/* Pure White Icon in a subtle dark container */}
          <div className="h-9 w-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white shadow-sm">
            {category.name.includes('Arithmetic') ? (
              <Calculator className="h-4 w-4 text-white" />
            ) : category.name.includes('Data') ? (
              <Layers className="h-4 w-4 text-white" />
            ) : category.name.includes('Algo') ? (
              <Code2 className="h-4 w-4 text-white" />
            ) : (
              <Cpu className="h-4 w-4 text-white" />
            )}
          </div>
          <span className="text-[11px] font-mono text-[#888888]">
            {catProblems.length} challenges
          </span>
        </div>

        <div>
          <h3 className="font-semibold text-sm text-white group-hover:text-white transition-colors">
            {category.name}
          </h3>
          {category.description && (
            <p className="text-[11px] text-[#8C8C8C] mt-1 leading-relaxed line-clamp-2">
              {category.description}
            </p>
          )}
        </div>
      </div>

      {/* Footer Info: Solved Status & View Arrow */}
      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-[11px] text-white/70">
          <CheckCircle2 className="h-3.5 w-3.5 text-white/80" />
          <span>{solvedCount} / {catProblems.length} Solved</span>
        </div>
        <span className="text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition-all flex items-center gap-0.5 text-[11px] font-medium">
          <span>View</span>
          <ChevronRight className="h-3.5 w-3.5 text-white" />
        </span>
      </div>
    </div>
  )
}


