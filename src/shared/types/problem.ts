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
  testCases: TestCase[]
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
