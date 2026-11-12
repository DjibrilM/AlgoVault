import { MarathonCardProps } from '../types'
import { homeService } from '../services/homeService'
import mountainImg from '@/assets/images/marathons/mountain-flag.png'

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
        className="group relative rounded-2xl bg-[#181818] p-6 hover:bg-[#1E1E1E] transition-all cursor-pointer shadow-lg hover:shadow-xl"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center">
                <img
                  src={mountainImg}
                  alt="Marathon"
                  className="h-6 w-6 object-contain drop-shadow"
                />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white transition-colors">
                  Marathon Mode
                </h2>
              </div>
            </div>

            <p className="text-xs text-[#A3A3A3] max-w-xl leading-relaxed">
              The system presents challenges in strict progression. You must complete the current step before unlocking the next milestone.
            </p>

            {/* Progress bar */}
            <div className="flex items-center gap-3 pt-2">
              <div className="w-48 bg-[#262626] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-white h-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-white/80 font-semibold">
                Step {nextStep} of {totalCount} Unlocked
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
