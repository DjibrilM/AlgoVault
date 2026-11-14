export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export type SupportedLang = 'typescript' | 'python' | 'javascript' | 'cpp'

export interface TestCase {
  id: number
  input: string
  expected: string
  /** If true, hidden from initial display and tested during full evaluation / submit */
  hidden?: boolean
  /** Raw standard input sent to the program process */
  stdin?: string
  /** Optional explanation of the test case */
  explanation?: string
}

export type Verdict =
  | 'Accepted'
  | 'Wrong Answer'
  | 'Time Limit Exceeded'
  | 'Memory Limit Exceeded'
  | 'Runtime Error'
  | 'Compile Error'
  | 'Internal Error'

export interface ProblemExample {
  id: number
  input: string
  output: string
  explanation?: string
}

export interface Problem {
  id: number
  slug: string
  title: string
  difficulty: Difficulty
  category: string
  acceptance: string
  solved: boolean
  starred: boolean
  isAIGenerated?: boolean
  description: string
  examples: ProblemExample[]
  constraints: string[]
  hints: string[]
  tags: string[]
  codeTemplates: Record<SupportedLang, string>
  /** Saved user solution from SQLite (initially empty) */
  solution?: string
  testCases: TestCase[]
}

export interface SubmissionRecordDto {
  id: number
  challengeId: number
  challenge?: {
    id: number
    title: string
    difficulty: Difficulty
    slug?: string
  } | null
  lang: string
  code: string
  status: string
  verdict: string
  passedCases: number
  totalCases: number
  timeMs: number
  cpuMs: number
  memoryKb: number
  output: string | null
  compileError: string | null
  createdAt: string
  updatedAt: string
}

export interface FavoriteRecordDto {
  id: number
  challengeId: number
  challenge?: {
    id: number
    slug: string
    title: string
    difficulty: Difficulty
    solved: boolean
    tags: string[]
    category?: {
      id: number
      title: string
    } | null
  } | null
  createdAt: string
  updatedAt: string
}

export interface MarathonStep {
  step: number
  problemId: number
  locked: boolean
  completed: boolean
}

export interface MarathonTrack {
  id: string
  title: string
  subtitle: string
  description: string
  coverIndex: number
  steps: MarathonStep[]
  difficultyRange: string
  tags?: string[]
}

export interface AICategory {
  id: string
  name: string
  icon?: string
  description?: string
  isCustom?: boolean
  problemIds: number[]
}

export interface RunResult {
  status: 'idle' | 'running' | 'success' | 'error'
  runtime?: string
  memory?: string
  output?: string
  verdict?: Verdict
  totalCases?: number
  passedCases?: number
  failedCaseIndex?: number
  expected?: string
  actual?: string
  compileError?: string
}

export interface FactoryConversationRecordDto {
  id: string
  title: string
  messages: Array<Record<string, unknown>>
  draft: Record<string, unknown> | null
  generatedQuestions: Array<Record<string, unknown>>
  generatedTarget: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface PaginatedFactoryConversationsDto {
  items: FactoryConversationRecordDto[]
  page: number
  limit: number
  total: number
  hasMore: boolean
}
