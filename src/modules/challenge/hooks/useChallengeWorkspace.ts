import { useCallback, useEffect, useRef, useState } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { Problem, RunResult, SupportedLang } from '@/shared/types/problem'
import {
  problemsAtom,
  selectedProblemIdAtom,
  solveProblemAtom,
  editorCodeAtom,
  runResultAtom,
  isRunningAtom,
  activeProblemsAtom,
  selectedLangAtom,
} from '@/shared/store'
import { useAppMenuAction } from '@/shared'
import { useAiConfigQuery, useSubmitCodeMutation } from '@/shared/hooks/useWorkspaceQueries'
import { aiClient } from '@/shared/services/aiClient'
import type { SolutionFeedbackState } from '../types'
import { toChallengeContextDto } from '../utils/challengeContext'
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

function buildOfflineSolutionFeedback(
  problem: Problem,
  code: string,
  lang: SupportedLang,
  result: RunResult
): string {
  const nestedLoopMatch = /\b(for|while)\b[\s\S]*\b(for|while)\b/.test(code)
  const hasSort = /\.sort\(|std::sort|sorted\(/.test(code)
  const estimatedComplexity = nestedLoopMatch
    ? '$O(n^2)$'
    : hasSort
      ? '$O(n \\log n)$'
      : '$O(n)$'

  const statusLine =
    result.status === 'success'
      ? `Great job passing ${result.passedCases ?? 'all'}/${result.totalCases ?? 'all'} test cases!`
      : `Your ${lang} submission hit **${result.verdict ?? 'an error'}** (${result.passedCases ?? 0}/${result.totalCases ?? '?'} cases passed).`

  const guidance = nestedLoopMatch
    ? `This is a solid start, and you can simplify nested loops toward linear $O(n)$ or $O(n \\log n)$ time complexity using a hash map, two pointers, or a sliding window depending on the constraint structure.`
    : hasSort
      ? `Using sorting puts you around $O(n \\log n)$ time. Check whether a frequency map or single-pass scan can reduce this to $O(n)$, or if $O(n \\log n)$ is already the cleanest trade-off without tedious micro-optimizations.`
      : `Your control flow already looks linear ($O(n)$). Once all edge cases pass, avoid tedious constant-factor micro-optimizations that hurt readability.`

  return `### Performance Snapshot
- **Estimated Time Complexity:** ${estimatedComplexity}
- **Status:** ${statusLine}

### Coach's Verdict
${guidance}

\`\`\`mermaid
flowchart LR
  Input["Input (${problem.title})"] --> Pass["Core Pass (${estimatedComplexity})"]
  Pass --> Output["Result & Edge Case Check"]
\`\`\`

> Configure an AI provider in **Settings** for deep line-by-line optimization coaching tailored to your exact implementation.`
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
  const [globalLang, setGlobalLang] = useAtom(selectedLangAtom)
  const submitCodeMutation = useSubmitCodeMutation()
  const { data: aiStatus } = useAiConfigQuery()

  // Local state fallbacks if props are provided
  const [localCode, setLocalCode] = useState<string>('')
  const [localIsRunning, setLocalIsRunning] = useState(false)
  const [localRunResult, setLocalRunResult] = useState<RunResult>({ status: 'idle' })

  const [feedbackByProblem, setFeedbackByProblem] = useState<
    Record<number, SolutionFeedbackState>
  >({})
  const feedbackByProblemRef = useRef<Record<number, SolutionFeedbackState>>({})
  const activeFeedbackRunRef = useRef<Record<number, string>>({})
  const unsubscribeFeedbackRef = useRef<Record<number, () => void>>({})
  const lastSubmissionRef = useRef<
    Record<number, { problem: Problem; code: string; lang: SupportedLang; result: RunResult }>
  >({})

  useEffect(() => {
    const unsubMap = unsubscribeFeedbackRef.current
    return () => {
      for (const unsub of Object.values(unsubMap)) {
        unsub()
      }
    }
  }, [])

  const updateProblemFeedback = useCallback(
    (problemId: number, updater: SolutionFeedbackState | ((prev?: SolutionFeedbackState) => SolutionFeedbackState)) => {
      const prev = feedbackByProblemRef.current[problemId]
      const next = typeof updater === 'function' ? updater(prev) : updater
      feedbackByProblemRef.current = { ...feedbackByProblemRef.current, [problemId]: next }
      setFeedbackByProblem(feedbackByProblemRef.current)
    },
    []
  )

  const runFeedbackAnalysis = useCallback(
    async (problem: Problem, submittedCode: string, lang: SupportedLang, result: RunResult) => {
      const trimmedCode = submittedCode.trim()
      if (!trimmedCode) return

      const problemId = problem.id
      lastSubmissionRef.current[problemId] = { problem, code: submittedCode, lang, result }

      const runId = `feedback-${problemId}-${Date.now()}`
      activeFeedbackRunRef.current[problemId] = runId
      unsubscribeFeedbackRef.current[problemId]?.()
      delete unsubscribeFeedbackRef.current[problemId]

      if (!aiClient.isAvailable() || !aiStatus?.configured) {
        updateProblemFeedback(problemId, {
          problemId,
          lang,
          codeSignature: trimmedCode,
          text: buildOfflineSolutionFeedback(problem, submittedCode, lang, result),
          isStreaming: false,
          cached: false,
          verdict: result.verdict,
        })
        return
      }

      updateProblemFeedback(problemId, {
        problemId,
        lang,
        codeSignature: trimmedCode,
        text: '',
        reasoning: '',
        isStreaming: true,
        cached: false,
        verdict: result.verdict,
      })

      const unsubscribe = aiClient.onStreamEvent((event) => {
        if (event.runId !== runId || activeFeedbackRunRef.current[problemId] !== runId) return
        if (event.type === 'text-delta') {
          updateProblemFeedback(problemId, (prev) => ({
            ...(prev ?? {
              problemId,
              lang,
              codeSignature: trimmedCode,
              text: '',
              isStreaming: true,
              verdict: result.verdict,
            }),
            text: `${prev?.text ?? ''}${event.delta}`,
          }))
        } else if (event.type === 'reasoning-delta') {
          updateProblemFeedback(problemId, (prev) => ({
            ...(prev ?? {
              problemId,
              lang,
              codeSignature: trimmedCode,
              text: '',
              isStreaming: true,
              verdict: result.verdict,
            }),
            reasoning: `${prev?.reasoning ?? ''}${event.delta}`,
          }))
        }
      })
      unsubscribeFeedbackRef.current[problemId] = unsubscribe

      try {
        const res = await aiClient.runSolutionFeedback({
          runId,
          problem: toChallengeContextDto(problem),
          code: submittedCode,
          lang,
          submission: {
            status: result.status === 'success' ? 'success' : 'error',
            verdict: result.verdict,
            runtime: result.runtime,
            memory: result.memory,
            passedCases: result.passedCases,
            totalCases: result.totalCases,
            failedCaseIndex: result.failedCaseIndex,
            expected: result.expected,
            actual: result.actual,
            output: result.output,
            compileError: result.compileError,
          },
          ...(aiStatus.modelId ? { modelId: aiStatus.modelId } : {}),
        })

        if (activeFeedbackRunRef.current[problemId] !== runId) return
        if (res.aborted) return

        updateProblemFeedback(problemId, (prev) => ({
          problemId,
          lang,
          codeSignature: trimmedCode,
          text: res.text || prev?.text || '',
          reasoning: res.reasoning || prev?.reasoning || undefined,
          isStreaming: false,
          cached: Boolean(res.cached),
          verdict: result.verdict,
        }))
      } catch (err) {
        if (activeFeedbackRunRef.current[problemId] !== runId) return
        const errorMessage = err instanceof Error ? err.message : String(err)
        if (/no api key|not configured/i.test(errorMessage)) {
          updateProblemFeedback(problemId, {
            problemId,
            lang,
            codeSignature: trimmedCode,
            text: buildOfflineSolutionFeedback(problem, submittedCode, lang, result),
            isStreaming: false,
            cached: false,
            verdict: result.verdict,
          })
          return
        }
        updateProblemFeedback(problemId, (prev) => ({
          problemId,
          lang,
          codeSignature: trimmedCode,
          text: prev?.text ?? '',
          reasoning: prev?.reasoning,
          isStreaming: false,
          cached: false,
          error: errorMessage,
          verdict: result.verdict,
        }))
      } finally {
        unsubscribe()
        if (unsubscribeFeedbackRef.current[problemId] === unsubscribe) {
          delete unsubscribeFeedbackRef.current[problemId]
        }
      }
    },
    [aiStatus?.configured, aiStatus?.modelId, updateProblemFeedback]
  )

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
      const result = await challengeService.runCode(currentProblem, code, globalLang)
      setRunResult(result)
    } finally {
      setIsRunning(false)
    }
  }

  const handleSubmitCode = async () => {
    setIsRunning(true)
    setRunResult({ status: 'running' })
    try {
      const submittedProblem = currentProblem
      const submittedCode = code
      const submittedLang = globalLang
      const result = await submitCodeMutation.mutateAsync({
        problem: submittedProblem,
        code: submittedCode,
        lang: submittedLang,
      })
      setRunResult(result)
      if (result.status === 'success') {
        onSolveProblem?.(selectedProblemId)
      }

      const trimmedCode = submittedCode.trim()
      const existing = feedbackByProblemRef.current[submittedProblem.id]
      if (
        existing &&
        !existing.error &&
        !existing.isStreaming &&
        existing.lang === submittedLang &&
        existing.codeSignature === trimmedCode &&
        existing.text
      ) {
        updateProblemFeedback(submittedProblem.id, {
          ...existing,
          cached: true,
          verdict: result.verdict,
        })
      } else {
        void runFeedbackAnalysis(submittedProblem, submittedCode, submittedLang, result)
      }
    } finally {
      setIsRunning(false)
    }
  }

  const retrySolutionFeedback = useCallback(() => {
    const last = lastSubmissionRef.current[currentProblem.id]
    if (!last) return
    void runFeedbackAnalysis(last.problem, last.code, last.lang, last.result)
  }, [currentProblem.id, runFeedbackAnalysis])

  useEffect(() => {
    window.appMenu?.syncState({ isRunning })
    return () => {
      window.appMenu?.syncState({ isRunning: false })
    }
  }, [isRunning])

  useAppMenuAction((action) => {
    if (action === 'challenge-run' && !isRunning) {
      void handleRunCode()
    } else if (action === 'challenge-submit' && !isRunning) {
      void handleSubmitCode()
    } else if (action === 'challenge-prev') {
      handlePrevProblem()
    } else if (action === 'challenge-next') {
      handleNextProblem()
    }
  })

  return {
    code,
    setCode,
    selectedLang: globalLang,
    setSelectedLang: setGlobalLang,
    isRunning,
    runResult,
    currentProblem,
    solutionFeedback: feedbackByProblem[currentProblem.id] ?? null,
    retrySolutionFeedback,
    handlePrevProblem,
    handleNextProblem,
    handleRunCode,
    handleSubmitCode,
  }
}
