import { Flame, ChevronRight } from 'lucide-react'
import { MarathonCardProps } from '../types'
import { homeService } from '../services/homeService'

export function MarathonCard({ marathonSteps, onSelect }: MarathonCardProps) {
  const { totalCount, percentage, nextStep } =
    homeService.getMarathonProgress(marathonSteps)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#8C8C8C] uppercase tracking-wider">
          Sequential Tracks
        </span>
      </div>

      <div
        onClick={onSelect}
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
                  className="bg-gradient-to-r from-[#F59E0B] to-[#10B981] h-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-[#F59E0B] font-semibold">
                Step {nextStep} of {totalCount} Unlocked
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
  )
}
