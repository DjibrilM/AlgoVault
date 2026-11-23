export interface ContributionDay {
  key: string
  date: Date
  count: number
}

export const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatReadableDate(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

export function getContributionHex(count: number): string {
  if (count <= 0) return '#222226'
  if (count === 1) return '#0e4429'
  if (count <= 3) return '#006d32'
  if (count <= 5) return '#26a641'
  return '#39d353'
}

export function buildContributionMatrix(
  countsByDate: Map<string, number>,
  year: number | 'last-year' = 'last-year'
): {
  weeks: Array<Array<ContributionDay | null>>
  monthLabels: Array<{ col: number; label: string }>
} {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let rangeEnd = today
  let start: Date

  if (typeof year === 'number') {
    rangeEnd = new Date(year, 11, 31)
    const jan1 = new Date(year, 0, 1)
    start = new Date(jan1)
    start.setDate(jan1.getDate() - jan1.getDay())
  } else {
    start = new Date(today)
    start.setDate(today.getDate() - today.getDay() - 52 * 7)
  }

  const weeks: Array<Array<ContributionDay | null>> = []
  const monthLabels: Array<{ col: number; label: string }> = []
  let lastMonth = -1

  const cursor = new Date(start)
  for (let w = 0; w < 54; w++) {
    if (cursor.getTime() > rangeEnd.getTime()) break
    const weekCol: Array<ContributionDay | null> = []
    for (let d = 0; d < 7; d++) {
      const outOfYear = typeof year === 'number' && cursor.getFullYear() !== year
      if (cursor.getTime() > rangeEnd.getTime() || outOfYear) {
        weekCol.push(null)
      } else {
        const key = toLocalDateKey(cursor)
        weekCol.push({
          key,
          date: new Date(cursor),
          count: countsByDate.get(key) ?? 0,
        })
        if (
          d === 0 ||
          (typeof year === 'number' && cursor.getDate() <= 7 && cursor.getMonth() !== lastMonth)
        ) {
          const month = cursor.getMonth()
          if (month !== lastMonth) {
            monthLabels.push({ col: w, label: MONTH_NAMES[month] })
            lastMonth = month
          }
        }
      }
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(weekCol)
  }

  return { weeks, monthLabels }
}

/** Computes the longest and current active day streaks from a local-date count map. */
export function computeStreaks(countsByDate: Map<string, number>): {
  currentStreak: number
  longestStreak: number
} {
  const activeKeys = Array.from(countsByDate.entries())
    .filter(([, count]) => count > 0)
    .map(([key]) => key)
    .sort()

  if (activeKeys.length === 0) {
    return { currentStreak: 0, longestStreak: 0 }
  }

  let longestStreak = 1
  let run = 1
  for (let i = 1; i < activeKeys.length; i++) {
    const prev = new Date(`${activeKeys[i - 1]}T00:00:00`)
    const curr = new Date(`${activeKeys[i]}T00:00:00`)
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86_400_000)
    if (diffDays === 1) {
      run += 1
      if (run > longestStreak) longestStreak = run
    } else if (diffDays > 1) {
      run = 1
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const cursor = (countsByDate.get(toLocalDateKey(today)) ?? 0) > 0 ? today : yesterday
  let currentStreak = 0
  while ((countsByDate.get(toLocalDateKey(cursor)) ?? 0) > 0) {
    currentStreak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return { currentStreak, longestStreak }
}
