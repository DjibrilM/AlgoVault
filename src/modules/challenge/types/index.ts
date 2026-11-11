import { ReactNode } from 'react'
import {
  Difficulty,
  SupportedLang,
  TestCase,
  ProblemExample,
  Problem,
  MarathonStep,
  AICategory,
  RunResult,
} from '@/shared/types/problem'

export type {
  Difficulty,
  SupportedLang,
  TestCase,
  ProblemExample,
  Problem,
  MarathonStep,
  AICategory,
  RunResult,
}

export interface ChallengeWorkspaceProps {
  problems?: Problem[]
  selectedProblemId?: number
  onSelectProblem?: (id: number) => void
  onSolveProblem?: (problemId: number) => void
  isSidebarOpen?: boolean
  onToggleSidebar?: () => void
}

export interface CodeEditorProps {
  problem?: Problem
  code?: string
  onChangeCode?: (newCode: string) => void
  onRun?: () => void
  onSubmit?: () => void
  isRunning?: boolean
  selectedLang?: SupportedLang
  onSelectLang?: (lang: SupportedLang) => void
}

export interface ChallengeSidebarProps {
  categoryTitle?: string
  problems?: Problem[]
  selectedProblemId?: number
  onSelectProblem?: (id: number) => void
  onBackToHome?: () => void
  onClose?: () => void
  isMarathon?: boolean
}

export interface ProblemDescriptionProps {
  problem?: Problem
  headerActions?: ReactNode
  isStreaming?: boolean
}

export interface TestCaseRunnerProps {
  problem?: Problem
  runResult?: RunResult
}
