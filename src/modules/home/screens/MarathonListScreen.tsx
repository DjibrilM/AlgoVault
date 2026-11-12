import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { MarathonTrack } from '@/shared/types/problem'
import { getMarathonCoverUrl } from '@/shared/utils/coverImages'
import { homeService } from '../services/homeService'
import mountainImg from '@/assets/images/marathons/mountain-flag.png'

interface MarathonListScreenProps {
  marathons: MarathonTrack[]
  onSelectMarathon: (marathon: MarathonTrack) => void
  onBackToHome: () => void
}

export function MarathonListScreen({
  marathons,
  onSelectMarathon,
  onBackToHome,
}: MarathonListScreenProps) {
  return (
    <div className="h-full flex flex-col bg-[#1A1A1A] text-[#E5E5E5] overflow-y-auto select-none p-8 space-y-6 scrollbar-thin">
      {/* Top Navigation & Breadcrumb */}
      <div className="max-w-5xl mx-auto w-full space-y-4">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs text-[#A3A3A3] hover:text-white transition-colors cursor-pointer py-2"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-white" />
          <span>Back to Home</span>
        </button>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
              <img
                src={mountainImg}
                alt="Marathon"
                className="h-6 w-6 object-contain drop-shadow"
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Marathon Tracks
            </h1>
          </div>
          <p className="text-xs text-[#8C8C8C] max-w-2xl">
            Structured tracks designed to build mastery through progressive difficulty. Complete each milestone to unlock the next challenge.
          </p>
        </div>
      </div>

      {/* Marathons Grid */}
      <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-5 pb-8">
        {marathons.map((marathon) => {
          const { totalCount, percentage, nextStep } =
            homeService.getMarathonProgress(marathon.steps)
          const coverUrl = getMarathonCoverUrl(marathon.coverIndex)

          return (
            <div
              key={marathon.id}
              onClick={() => onSelectMarathon(marathon)}
              className="group relative rounded-2xl border border-white/[0.04] hover:border-white/[0.08] bg-[#202020] hover:bg-[#252525] transition-all duration-300 cursor-pointer overflow-hidden shadow-lg hover:shadow-2xl flex flex-col justify-between"
            >
              {/* Cover Banner (No border beneath banner) */}
              <div className="relative h-44 w-full overflow-hidden bg-[#111111]">
                <img
                  src={coverUrl}
                  alt={marathon.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#202020] via-black/40 to-black/15" />

                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="font-bold text-base text-white transition-colors">
                    {marathon.title}
                  </h3>
                  <p className="text-[11px] text-[#D4D4D4] line-clamp-1 mt-0.5">
                    {marathon.subtitle}
                  </p>
                </div>
              </div>

              {/* Description & Details */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <p className="text-xs text-[#8C8C8C] leading-relaxed">
                  {marathon.description}
                </p>

                {/* Progress bar */}
                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-[#A3A3A3]">
                      <span className="flex items-center gap-1 text-white">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                        <span>Step {nextStep} of {totalCount} Unlocked</span>
                      </span>
                    </div>

                    <div className="w-full bg-[#2C2C2C] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-white h-full transition-all duration-300"
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      />
                    </div>
                  </div>

                  {marathon.tags && marathon.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {marathon.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/70"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MarathonListScreen
