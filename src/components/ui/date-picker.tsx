import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  id?: string
  value: string
  onChange: (nextDate: string) => void
  placeholder?: string
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]

function toYmd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseYmd(value: string): Date | null {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  const parsed = new Date(y, m - 1, d)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function addDays(base: Date, days: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + days)
}

function formatFullDate(value: string): string {
  const date = parseYmd(value)
  if (!date) return ''
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function getRelativeHint(value: string): string | null {
  const target = parseYmd(value)
  if (!target) return null
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff < -1) return `${Math.abs(diff)}d overdue`
  return `In ${diff}d`
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = 'Select deadline (optional)',
}: DatePickerProps) {
  const today = useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }, [])
  const todayStr = useMemo(() => toYmd(today), [today])

  const initialAnchor = parseYmd(value) ?? today
  const [isOpen, setIsOpen] = useState(false)
  const [viewYear, setViewYear] = useState(initialAnchor.getFullYear())
  const [viewMonth, setViewMonth] = useState(initialAnchor.getMonth())

  const quickPresets = useMemo(
    () => [
      { label: 'Today', date: today, dateStr: toYmd(today) },
      { label: 'Tomorrow', date: addDays(today, 1), dateStr: toYmd(addDays(today, 1)) },
      { label: 'In 3 days', date: addDays(today, 3), dateStr: toYmd(addDays(today, 3)) },
      { label: 'Next week', date: addDays(today, 7), dateStr: toYmd(addDays(today, 7)) },
      { label: 'In 2 weeks', date: addDays(today, 14), dateStr: toYmd(addDays(today, 14)) },
    ],
    [today]
  )

  const calendarCells = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1)
    const mondayOffset = (firstOfMonth.getDay() + 6) % 7
    const gridStart = new Date(viewYear, viewMonth, 1 - mondayOffset)

    return Array.from({ length: 42 }, (_, idx) => {
      const cellDate = new Date(
        gridStart.getFullYear(),
        gridStart.getMonth(),
        gridStart.getDate() + idx
      )
      const dateStr = toYmd(cellDate)
      return {
        dateStr,
        day: cellDate.getDate(),
        isCurrentMonth: cellDate.getMonth() === viewMonth,
        isToday: dateStr === todayStr,
        isSelected: dateStr === value,
      }
    })
  }, [todayStr, value, viewMonth, viewYear])

  const monthHeading = useMemo(
    () =>
      new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
    [viewMonth, viewYear]
  )

  const handleToggle = () => {
    if (!isOpen) {
      const anchor = parseYmd(value) ?? today
      setViewYear(anchor.getFullYear())
      setViewMonth(anchor.getMonth())
    }
    setIsOpen((prev) => !prev)
  }

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1)
      setViewMonth(11)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1)
      setViewMonth(0)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const handleSelectDate = (nextStr: string) => {
    onChange(nextStr)
    const parsed = parseYmd(nextStr)
    if (parsed) {
      setViewYear(parsed.getFullYear())
      setViewMonth(parsed.getMonth())
    }
    setIsOpen(false)
  }

  const relativeHint = getRelativeHint(value)
  const monthKey = `${viewYear}-${viewMonth}`

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <button
          id={id}
          type="button"
          onClick={handleToggle}
          aria-expanded={isOpen}
          className="h-10 flex-1 min-w-0 rounded-xl bg-[#131315] hover:bg-[#17171A] px-3.5 flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer text-left"
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <CalendarIcon className="h-3.5 w-3.5 text-[#737373] shrink-0" />
            {value ? (
              <span className="font-medium text-white truncate">{formatFullDate(value)}</span>
            ) : (
              <span className="text-[#525252] truncate">{placeholder}</span>
            )}
          </span>

          <span className="flex items-center gap-2 shrink-0">
            {relativeHint && (
              <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-[#D4D4D4]">
                {relativeHint}
              </span>
            )}
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 text-[#737373] transition-transform duration-200',
                isOpen && 'rotate-180 text-[#D4D4D4]'
              )}
            />
          </span>
        </button>

        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear deadline"
            title="Clear deadline"
            className="h-10 w-10 rounded-xl bg-[#131315] hover:bg-[#17171A] flex items-center justify-center text-[#737373] hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="date-picker-collapse"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ y: -8, scale: 0.985 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: -6, scale: 0.985 }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
              className="mt-2 rounded-xl bg-[#131315] p-3.5 grid grid-cols-1 sm:grid-cols-[155px_1fr] gap-4 origin-top"
            >
              {/* Quick Presets */}
              <div className="flex flex-col justify-between gap-1 sm:pr-3 sm:border-r sm:border-white/[0.05]">
                <div className="space-y-1">
                  {quickPresets.map((preset) => {
                    const active = value === preset.dateStr
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleSelectDate(preset.dateStr)}
                        className={cn(
                          'w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer',
                          active
                            ? 'bg-white text-[#111111] font-semibold'
                            : 'text-[#A3A3A3] hover:bg-white/[0.05] hover:text-white'
                        )}
                      >
                        <span>{preset.label}</span>
                        <span
                          className={cn(
                            'text-[10px]',
                            active ? 'text-[#525252]' : 'text-[#666666]'
                          )}
                        >
                          {formatShortDate(preset.date)}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onChange('')
                    setIsOpen(false)
                  }}
                  className="w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-[#737373] hover:bg-white/[0.05] hover:text-[#D4D4D4] transition-colors cursor-pointer"
                >
                  No deadline
                </button>
              </div>

              {/* Month Calendar */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-white tracking-tight">
                    {monthHeading}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setViewYear(today.getFullYear())
                        setViewMonth(today.getMonth())
                      }}
                      className="rounded-md px-2 py-1 text-[11px] font-medium text-[#8C8C8C] hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      aria-label="Previous month"
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-[#A3A3A3] hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      aria-label="Next month"
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-[#A3A3A3] hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {WEEKDAYS.map((day) => (
                    <div
                      key={day}
                      className="py-1 text-center text-[10px] font-medium uppercase tracking-wider text-[#666666]"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={monthKey}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.14, ease: EASE_OUT }}
                    className="grid grid-cols-7 gap-1"
                  >
                    {calendarCells.map((cell) => (
                      <button
                        key={cell.dateStr}
                        type="button"
                        onClick={() => handleSelectDate(cell.dateStr)}
                        className={cn(
                          'relative h-8 rounded-lg text-xs transition-colors cursor-pointer flex flex-col items-center justify-center',
                          cell.isSelected
                            ? 'bg-white text-[#111111] font-semibold'
                            : cell.isCurrentMonth
                              ? 'text-[#E5E5E5] hover:bg-white/[0.07]'
                              : 'text-[#525252] hover:bg-white/[0.04] hover:text-[#8C8C8C]'
                        )}
                      >
                        <span className="tabular-nums leading-none">{cell.day}</span>
                        {cell.isToday && !cell.isSelected && (
                          <span className="mt-1 h-1 w-1 rounded-full bg-white/70" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
