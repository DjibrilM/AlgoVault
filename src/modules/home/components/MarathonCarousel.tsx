import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { MarathonTrack } from '@/shared/types/problem'
import { getMarathonCoverUrl } from '@/shared/utils/coverImages'
import { homeService } from '../services/homeService'
import mountainImg from '@/assets/images/marathons/mountain-flag.png'

interface MarathonCarouselProps {
  marathons: MarathonTrack[]
  onSelectMarathon: (marathon: MarathonTrack) => void
  onViewAll?: () => void
}

export function MarathonCarousel({
  marathons,
  onSelectMarathon,
  onViewAll,
}: MarathonCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    const el = scrollContainerRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 10)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
  }

  useEffect(() => {
    checkScroll()
    const el = scrollContainerRef.current
    if (!el) return
    el.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [marathons])

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current
    if (!el) return
    const scrollAmount = 480
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  return (
    <div className="space-y-3 select-none">
      {/* Carousel Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white tracking-wide uppercase">
              Marathon Tracks
            </span>
          </div>
          <p className="text-[11px] text-[#8C8C8C]">
            Step-by-step challenges. Complete each problem to unlock the next milestone.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs text-white/70 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View all ({marathons.length})</span>
              <ArrowRight className="h-3.5 w-3.5 text-white" />
            </button>
          )}

          {/* Left / Right Nav Controls */}
          <div className="flex items-center gap-1 text-white">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="h-7 w-7 rounded-lg border border-[#2E2E2E] bg-[#161616] hover:bg-[#222222] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer text-white"
              title="Previous marathon"
            >
              <ChevronLeft className="h-4 w-4 text-white" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="h-7 w-7 rounded-lg border border-[#2E2E2E] bg-[#161616] hover:bg-[#222222] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer text-white"
              title="Next marathon"
            >
              <ChevronRight className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scroll Carousel with Edge Fade Shadows */}
      <div className="relative -mx-4">
        {/* Left Edge Shadow Fade (sits in the 16px gutter; gap-5 ensures previous snapped card is off-screen) */}
        <div
          className={`pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-[#1A1A1A] to-transparent z-30 transition-opacity duration-200 ${
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Right Edge Shadow Fade */}
        <div
          className={`pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[#1A1A1A] to-transparent z-30 transition-opacity duration-200 ${
            canScrollRight ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <div
          ref={scrollContainerRef}
          className="flex items-center gap-5 overflow-x-auto scrollbar-none px-4 scroll-px-4 pb-2 pt-1 scroll-smooth snap-x snap-mandatory"
        >
        {marathons.map((marathon) => {
          const { totalCount, percentage, nextStep } =
            homeService.getMarathonProgress(marathon.steps)
          const coverUrl = getMarathonCoverUrl(marathon.coverIndex)

          return (
            <div
              key={marathon.id}
              onClick={() => onSelectMarathon(marathon)}
              className="group relative flex-shrink-0 w-[360px] md:w-[400px] h-[185px] rounded-2xl overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-300 snap-start flex flex-col justify-between bg-[#141414]"
            >
              {/* Background Cover Image with subtle zoom on hover */}
              <img
                src={coverUrl}
                alt={marathon.title}
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out z-0"
              />

              {/* Scrim Overlay for contrast */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/30 z-10" />

              {/* Top Row: Milestone Icon */}
              <div className="relative z-20 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center">
                    <img
                      src={mountainImg}
                      alt="Marathon"
                      className="h-6 w-6 object-contain drop-shadow"
                    />
                  </div>
                </div>
              </div>

              {/* Center Content: Title & Subtitle */}
              <div className="relative z-20 px-4 space-y-1">
                <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-white transition-colors">
                  {marathon.title}
                </h3>
                <p className="text-xs text-[#CCCCCC] line-clamp-1 leading-snug">
                  {marathon.subtitle}
                </p>
              </div>

              {/* Bottom Row: Progress bar */}
              <div className="relative z-20 p-4 pt-0 flex items-center justify-between gap-4">
                <div className="flex-1 space-y-1.5">
                  <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-white h-full transition-all duration-500"
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-white/80">
                    Step {nextStep} of {totalCount} Unlocked
                  </span>
                </div>
              </div>
            </div>
          )
        })}
        </div>
      </div>
    </div>
  )
}
