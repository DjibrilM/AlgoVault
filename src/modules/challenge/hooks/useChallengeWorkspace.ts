import { useState } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { Problem, RunResult } from '@/shared/types/problem'
import {
  problemsAtom,
  selectedProblemIdAtom,
  solveProblemAtom,
  editorCodeAtom,
  runResultAtom,
  isRunningAtom,
  activeProblemsAtom,
} from '@/shared/store'
import { challengeService } from '../services/challengeService'

const FALLBACK_PROBLEM: Problem = {
  id: 1,
  slug: 'sample',
  title: 'No problem selected',
  difficulty: 'Easy',
  category: 'General',
  acceptance: '50%',
  solved: false,
  starred: false,
  description: 'Select a problem from the sidebar.',
  examples: [],
  constraints: [],
  hints: [],
  tags: [],
  codeTemplates: { typescript: '', python: '', javascript: '', cpp: '' },
  testCases: [],
}

export interface UseChallengeWorkspaceOptions {
  problems?: Problem[]
  selectedProblemId?: number
  onSelectProblem?: (id: number) => void
  onSolveProblem?: (problemId: number) => void
}

/**
 * Manages active challenge resolution, code buffer, simulated execution,
 * and previous/next problem pagination. Integrates seamlessly with Jotai global state.
 */
export function useChallengeWorkspace(options?: UseChallengeWorkspaceOptions) {
  // Global Jotai state fallbacks
  const globalActiveProblems = useAtomValue(activeProblemsAtom)
  const globalAllProblems = useAtomValue(problemsAtom)
  const [globalSelectedId, setGlobalSelectedId] = useAtom(selectedProblemIdAtom)
  const globalSolve = useSetAtom(solveProblemAtom)
  const [globalCode, setGlobalCode] = useAtom(editorCodeAtom)
  const [globalIsRunning, setGlobalIsRunning] = useAtom(isRunningAtom)
  const [globalRunResult, setGlobalRunResult] = useAtom(runResultAtom)

  // Local state fallbacks if props are provided
  const [localCode, setLocalCode] = useState<string>('')
  const [localIsRunning, setLocalIsRunning] = useState(false)
  const [localRunResult, setLocalRunResult] = useState<RunResult>({ status: 'idle' })

  const problems = options?.problems ?? (globalActiveProblems.length > 0 ? globalActiveProblems : globalAllProblems)
  const selectedProblemId = options?.selectedProblemId ?? globalSelectedId
  const onSelectProblem = options?.onSelectProblem ?? setGlobalSelectedId
  const onSolveProblem = options?.onSolveProblem ?? globalSolve

  const isControlled = Boolean(options?.problems)
  const code = isControlled ? localCode : globalCode
  const setCode = isControlled ? setLocalCode : setGlobalCode
  const isRunning = isControlled ? localIsRunning : globalIsRunning
  const setIsRunning = isControlled ? setLocalIsRunning : setGlobalIsRunning
  const runResult = isControlled ? localRunResult : globalRunResult
  const setRunResult = isControlled ? setLocalRunResult : setGlobalRunResult

  const currentProblem =
    problems.find((p) => p.id === selectedProblemId) || problems[0] || FALLBACK_PROBLEM

  const handlePrevProblem = () => {
    const idx = problems.findIndex((p) => p.id === selectedProblemId)
    if (idx > 0) {
      onSelectProblem(problems[idx - 1].id)
      setRunResult({ status: 'idle' })
    }
  }

  const handleNextProblem = () => {
    const idx = problems.findIndex((p) => p.id === selectedProblemId)
    if (idx !== -1 && idx < problems.length - 1) {
      onSelectProblem(problems[idx + 1].id)
      setRunResult({ status: 'idle' })
    }
  }

  const handleRunCode = async () => {
    setIsRunning(true)
    setRunResult({ status: 'running' })
    try {
      const result = await challengeService.runCode(currentProblem, code)
      setRunResult(result)
    } finally {
      setIsRunning(false)
    }
  }

  const handleSubmitCode = async () => {
    setIsRunning(true)
    setRunResult({ status: 'running' })
    try {
      const result = await challengeService.submitCode(currentProblem, code)
      setRunResult(result)
      onSolveProblem?.(selectedProblemId)
    } finally {
      setIsRunning(false)
    }
  }

  return {
    code,
    setCode,
    isRunning,
    runResult,
    currentProblem,
    handlePrevProblem,
    handleNextProblem,
    handleRunCode,
    handleSubmitCode,
  }
}
