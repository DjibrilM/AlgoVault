import type {
  AICategory,
  MarathonTrack,
  Problem,
  SubmissionRecordDto,
} from '@/shared/types/problem'

export type SearchDocKind = 'problem' | 'category' | 'marathon' | 'submission'

export type SearchMatchField =
  | 'Title'
  | 'Difficulty'
  | 'Topic'
  | 'Question'
  | 'Explanation'
  | 'Submission'

export interface IndexedField {
  label: SearchMatchField
  raw: string
  lower: string
  weight: number
}

export interface SearchDocument {
  id: string
  kind: SearchDocKind
  title: string
  subtitle: string
  difficulty?: Problem['difficulty']
  problemId?: number
  categoryName?: string
  isMarathon?: boolean
  fields: IndexedField[]
  tokens: string[]
}

export interface SearchHit {
  doc: SearchDocument
  score: number
  matchedField: SearchMatchField
  snippet: string
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim()
}

function tokenize(text: string): string[] {
  const seen = new Set<string>()
  const matches = normalize(text).match(/[a-z0-9]{2,}/g)
  if (!matches) return []
  for (const token of matches) {
    seen.add(token)
  }
  return Array.from(seen)
}

/**
 * Bounded Damerau-Levenshtein distance with early exit when distance exceeds `maxDist`.
 */
function boundedEditDistance(a: string, b: string, maxDist: number): number {
  const lenA = a.length
  const lenB = b.length
  if (Math.abs(lenA - lenB) > maxDist) return maxDist + 1
  if (a === b) return 0

  const dp: number[][] = Array.from({ length: lenA + 1 }, () =>
    new Array<number>(lenB + 1).fill(0)
  )
  for (let i = 0; i <= lenA; i++) dp[i][0] = i
  for (let j = 0; j <= lenB; j++) dp[0][j] = j

  for (let i = 1; i <= lenA; i++) {
    let rowMin = maxDist + 1
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let val = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      )
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        val = Math.min(val, dp[i - 2][j - 2] + 1)
      }
      dp[i][j] = val
      if (val < rowMin) rowMin = val
    }
    if (rowMin > maxDist) return maxDist + 1
  }

  return dp[lenA][lenB]
}

function extractSnippet(raw: string, term: string): string {
  const clean = raw.replace(/\s+/g, ' ').trim()
  if (!clean) return ''
  const idx = clean.toLowerCase().indexOf(term)
  if (idx === -1) {
    return clean.length > 110 ? `${clean.slice(0, 107)}…` : clean
  }
  const start = Math.max(0, idx - 36)
  const end = Math.min(clean.length, idx + term.length + 68)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < clean.length ? '…' : ''
  return `${prefix}${clean.slice(start, end)}${suffix}`
}

/**
 * Builds an in-memory search index covering titles, questions/descriptions,
 * explanations (hints & solutions), difficulties, tags, topics, marathons, and submissions.
 */
export function buildSearchIndex(
  problems: Problem[],
  categories: AICategory[],
  marathons: MarathonTrack[],
  submissions: SubmissionRecordDto[]
): SearchDocument[] {
  const docs: SearchDocument[] = []

  for (const p of problems) {
    const examplesText = (p.examples ?? [])
      .map((ex) => `${ex.input} ${ex.output} ${ex.explanation ?? ''}`)
      .join(' ')
    const questionText = [p.description, examplesText, ...(p.constraints ?? [])]
      .filter(Boolean)
      .join(' ')
    const explanationText = [
      ...(p.hints ?? []),
      p.solution ?? '',
    ]
      .filter(Boolean)
      .join(' ')
    const topicText = [p.category, ...(p.tags ?? [])].filter(Boolean).join(' ')

    const fields: IndexedField[] = [
      { label: 'Title', raw: p.title, lower: normalize(p.title), weight: 100 },
      { label: 'Difficulty', raw: p.difficulty, lower: normalize(p.difficulty), weight: 85 },
      { label: 'Topic', raw: topicText, lower: normalize(topicText), weight: 75 },
      { label: 'Question', raw: questionText, lower: normalize(questionText), weight: 55 },
      { label: 'Explanation', raw: explanationText, lower: normalize(explanationText), weight: 50 },
    ]

    docs.push({
      id: `problem:${p.id}`,
      kind: 'problem',
      title: p.title,
      subtitle: `${p.category} · ${p.difficulty}`,
      difficulty: p.difficulty,
      problemId: p.id,
      categoryName: p.category,
      fields,
      tokens: tokenize(fields.map((f) => f.raw).join(' ')),
    })
  }

  for (const cat of categories) {
    const desc = cat.description ?? ''
    const fields: IndexedField[] = [
      { label: 'Title', raw: cat.name, lower: normalize(cat.name), weight: 90 },
      { label: 'Topic', raw: desc, lower: normalize(desc), weight: 50 },
    ]
    docs.push({
      id: `category:${cat.id}`,
      kind: 'category',
      title: cat.name,
      subtitle: `${cat.problemIds.length} ${cat.problemIds.length === 1 ? 'problem' : 'problems'}`,
      categoryName: cat.name,
      isMarathon: false,
      fields,
      tokens: tokenize(`${cat.name} ${desc}`),
    })
  }

  for (const m of marathons) {
    const topicText = [m.subtitle, m.difficultyRange, ...(m.tags ?? [])].filter(Boolean).join(' ')
    const fields: IndexedField[] = [
      { label: 'Title', raw: m.title, lower: normalize(m.title), weight: 88 },
      { label: 'Difficulty', raw: m.difficultyRange, lower: normalize(m.difficultyRange), weight: 70 },
      { label: 'Topic', raw: `${topicText} ${m.description}`, lower: normalize(`${topicText} ${m.description}`), weight: 55 },
    ]
    docs.push({
      id: `marathon:${m.id}`,
      kind: 'marathon',
      title: m.title,
      subtitle: `Marathon · ${m.difficultyRange}`,
      categoryName: m.title,
      isMarathon: true,
      fields,
      tokens: tokenize(`${m.title} ${topicText} ${m.description}`),
    })
  }

  for (const sub of submissions) {
    const challengeTitle = sub.challenge?.title ?? `Challenge #${sub.challengeId}`
    const matchedProblem = problems.find((p) => p.id === sub.challengeId)
    const subText = [sub.verdict, sub.status, sub.lang, sub.output ?? '', sub.code.slice(0, 400)]
      .filter(Boolean)
      .join(' ')
    const fields: IndexedField[] = [
      { label: 'Title', raw: challengeTitle, lower: normalize(challengeTitle), weight: 70 },
      { label: 'Submission', raw: subText, lower: normalize(subText), weight: 60 },
      ...(sub.challenge?.difficulty
        ? [{ label: 'Difficulty' as const, raw: sub.challenge.difficulty, lower: normalize(sub.challenge.difficulty), weight: 55 }]
        : []),
    ]
    docs.push({
      id: `submission:${sub.id}`,
      kind: 'submission',
      title: `${challengeTitle} (${sub.lang})`,
      subtitle: `${sub.verdict} · ${sub.passedCases}/${sub.totalCases} cases`,
      difficulty: sub.challenge?.difficulty,
      problemId: sub.challengeId,
      categoryName: matchedProblem?.category,
      fields,
      tokens: tokenize(`${challengeTitle} ${subText}`),
    })
  }

  return docs
}

/**
 * Queries the search index using substring `.includes()` matching across all indexed fields
 * plus bounded edit-distance fallback so typos (e.g. "heard" -> "hard") still surface matches.
 */
export function querySearchIndex(index: SearchDocument[], rawQuery: string, limit = 24): SearchHit[] {
  const cleaned = normalize(rawQuery)
  if (!cleaned) return []

  const terms = cleaned.split(' ').filter(Boolean)
  const hits: SearchHit[] = []

  for (const doc of index) {
    let totalScore = 0
    let bestField: IndexedField | null = null
    let bestFieldScore = -1
    let bestTerm = terms[0]
    let allMatched = true

    for (const term of terms) {
      let termScore = 0
      let termField: IndexedField | null = null

      // 1. Direct `.includes()` matching across every indexed field
      for (const field of doc.fields) {
        if (!field.lower.includes(term)) continue
        const exactBonus = field.lower === term ? 35 : 0
        const wordPrefixBonus = field.lower.startsWith(term) || field.lower.includes(` ${term}`) ? 15 : 0
        const score = field.weight + exactBonus + wordPrefixBonus
        if (score > termScore) {
          termScore = score
          termField = field
        }
      }

      // 2. Typo-tolerant fuzzy fallback (e.g. "heard" -> "hard")
      if (termScore === 0 && term.length >= 3) {
        const maxDist = term.length <= 5 ? 1 : 2
        let closestToken = ''
        let closestDist = maxDist + 1

        for (const token of doc.tokens) {
          const dist = boundedEditDistance(term, token, maxDist)
          if (dist < closestDist) {
            closestDist = dist
            closestToken = token
            if (dist === 1) break
          }
        }

        if (closestToken) {
          const matchingField =
            doc.fields.find((f) => f.lower.includes(closestToken)) ?? doc.fields[0]
          termScore = Math.max(12, Math.round((matchingField?.weight ?? 40) * 0.55) - closestDist * 8)
          termField = matchingField ?? null
          bestTerm = closestToken
        }
      }

      if (termScore === 0) {
        allMatched = false
        break
      }

      totalScore += termScore
      if (termField && termScore > bestFieldScore) {
        bestFieldScore = termScore
        bestField = termField
        if (termField.lower.includes(term)) {
          bestTerm = term
        }
      }
    }

    if (!allMatched || !bestField) continue

    hits.push({
      doc,
      score: totalScore + (doc.kind === 'problem' ? 10 : 0),
      matchedField: bestField.label,
      snippet: extractSnippet(bestField.raw, bestTerm),
    })
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit)
}
