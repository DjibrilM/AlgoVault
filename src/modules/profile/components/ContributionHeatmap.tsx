import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  buildContributionMatrix,
  formatReadableDate,
  type ContributionDay,
} from '../utils/contributionMatrix'

interface ContributionHeatmapProps {
  /** Map of local YYYY-MM-DD date string to successful submission count */
  countsByDate: Map<string, number>
  /** 'last-year' shows rolling 52 weeks up to today; a numeric year shows Jan 1–Dec 31 of that year */
  year?: number | 'last-year'
}

function getLevelClass(count: number): string {
  if (count <= 0) return 'bg-[#222226]'
  if (count === 1) return 'bg-[#0e4429]'
  if (count <= 3) return 'bg-[#006d32]'
  if (count <= 5) return 'bg-[#26a641]'
  return 'bg-[#39d353]'
}

/**
 * GitHub-style 52-week contribution heatmap where each contribution is a passed submission.
 */
export function ContributionHeatmap({ countsByDate, year = 'last-year' }: ContributionHeatmapProps) {
  const [hovered, setHovered] = useState<ContributionDay | null>(null)

  const { weeks, monthLabels } = useMemo(
    () => buildContributionMatrix(countsByDate, year),
    [countsByDate, year]
  )

  return (
    <div className="w-fit max-w-full space-y-2.5">
      <div className="overflow-x-auto pb-1 scrollbar-thin">
        <div className="inline-block w-fit">
          {/* Month Labels */}
          <div className="flex items-center pl-8 mb-1.5 text-[10px] text-[#737373] h-4 relative">
            {monthLabels.map((item) => (
              <span
                key={`${item.col}-${item.label}`}
                style={{ left: `${32 + item.col * 13}px` }}
                className="absolute"
              >
                {item.label}
              </span>
            ))}
          </div>

          <div className="flex gap-1.5">
            {/* Weekday Labels */}
            <div className="flex flex-col justify-between py-[2px] text-[10px] text-[#666666] w-6 shrink-0">
              <span className="h-[10px]" />
              <span className="leading-[10px]">Mon</span>
              <span className="h-[10px]" />
              <span className="leading-[10px]">Wed</span>
              <span className="h-[10px]" />
              <span className="leading-[10px]">Fri</span>
              <span className="h-[10px]" />
            </div>

            {/* 53 x 7 Matrix */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3px]">
                  {week.map((day, dIdx) =>
                    day ? (
                      <button
                        key={day.key}
                        type="button"
                        onMouseEnter={() => setHovered(day)}
                        onMouseLeave={() => setHovered((cur) => (cur?.key === day.key ? null : cur))}
                        aria-label={`${day.count} contributions on ${formatReadableDate(day.date)}`}
                        className={cn(
                          'h-[10px] w-[10px] rounded-[2px] transition-transform hover:scale-125 focus-visible:outline-none',
                          getLevelClass(day.count)
                        )}
                      />
                    ) : (
                      <div key={`empty-${wIdx}-${dIdx}`} className="h-[10px] w-[10px]" />
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Hover info + Legend */}
      <div className="flex items-center justify-between text-[11px] text-[#737373]">
        <div className="min-h-[16px]">
          {hovered ? (
            <span>
              <strong className="text-white font-medium">
                {hovered.count} {hovered.count === 1 ? 'contribution' : 'contributions'}
              </strong>{' '}
              on {formatReadableDate(hovered.date)}
            </span>
          ) : (
            <span>Each contribution represents an accepted submission.</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span>Less</span>
          <span className="h-[10px] w-[10px] rounded-[2px] bg-[#222226]" />
          <span className="h-[10px] w-[10px] rounded-[2px] bg-[#0e4429]" />
          <span className="h-[10px] w-[10px] rounded-[2px] bg-[#006d32]" />
          <span className="h-[10px] w-[10px] rounded-[2px] bg-[#26a641]" />
          <span className="h-[10px] w-[10px] rounded-[2px] bg-[#39d353]" />
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
