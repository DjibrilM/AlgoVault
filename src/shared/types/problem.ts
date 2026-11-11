export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export type SupportedLang = 'typescript' | 'python' | 'javascript' | 'cpp'

export interface TestCase {
  id: number
  input: string
  expected: string
}

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
}
