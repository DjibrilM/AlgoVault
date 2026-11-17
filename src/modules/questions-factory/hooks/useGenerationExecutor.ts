import { useCallback, useEffect, useRef, useState } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { useQueryClient } from '@tanstack/react-query'
import type { AIState } from '@/components/ui/smoothui/ai-core'
import { useCreateCategoryMutation } from '@/shared/hooks/useWorkspaceQueries'
import { QUERY_KEYS } from '@/shared/lib/queryClient'
import { databaseClient } from '@/shared/services/databaseClient'
import {
  categoriesAtom,
  findCategoryByTitle,
  hydrateWorkspaceAtom,
  marathonStepsAtom,
  marathonsAtom,
  problemsAtom,
  selectCategoryAtom,
} from '@/shared/store'
import type { Problem } from '@/shared/types/problem'
import type {
  GeneratedTarget,
  GenerationOverlayPhase,
  GenerationProcessStatus,
  StudioMessage,
} from '../types'
import {
  buildGeneratedQuestions,
  type GeneratedQuestionItem,
  type GenerationDraft,
} from '../utils/draftEngine'

interface UseGenerationExecutorOptions {
  onActivityChange: (state: AIState) => void
  onMarkDraftGenerated: () => void
  onAppendMessage: (message: StudioMessage) => void
  onGenerationComplete?: (payload: {
    questions: GeneratedQuestionItem[]
    target: GeneratedTarget
  }) => void
}

interface ProcessStageSpec {
  label: string
  detail: string
  activity: AIState
  durationMs: number
}

interface StageBuildOptions {
  isExtendedDemo?: boolean
  isRetryAttempt?: boolean
}

export interface ExecuteGenerationOptions {
  isSimulation?: boolean
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** Builds first-person companion status messages shown under the centered orb during generation. */
function buildGenerationProcessStages(
  targetDraft: GenerationDraft,
  options?: StageBuildOptions
): ProcessStageSpec[] {
  const topic = targetDraft.topic ?? 'Custom Practice'
  const count = targetDraft.questionCount ?? 5
  const styleLabel = (targetDraft.questionStyle ?? 'Mixed').toLowerCase()
  const difficultyLabel = (targetDraft.difficulty ?? 'balanced').toLowerCase()
  const isMarathon = targetDraft.contentType === 'Marathon Track'
  // Give demo zoom-in runs generous stage pacing so animation details read clearly
  const tempoScale = options?.isExtendedDemo && !options?.isRetryAttempt ? 1.45 : 1.08

  return [
    {
      label: options?.isRetryAttempt
        ? `Let me take another look at ${topic}...`
        : `Let me prepare your ${topic}...`,
      detail: `Shaping a ${difficultyLabel} path tailored to your goal`,
      activity: 'thinking',
      durationMs: Math.round(1250 * tempoScale),
    },
    {
      label: isMarathon
        ? `I'm weaving ${count} progressive stages...`
        : `I'm crafting ${count} ${styleLabel} problems...`,
      detail: 'Balancing core patterns, edge cases, and flow',
      activity: 'thinking',
      durationMs: Math.round(1150 * tempoScale),
    },
    {
      label: 'Let me polish the hints and tests...',
      detail: 'Preparing sample walkthroughs and starter code',
      activity: 'streaming',
      durationMs: Math.round(1150 * tempoScale),
    },
    {
      label: 'Almost there, wiring everything in...',
      detail: isMarathon
        ? `Setting up your ${topic} marathon track`
        : `Organizing your ${topic} workspace`,
      activity: 'streaming',
      durationMs: Math.round(1000 * tempoScale),
    },
  ]
}

const DEFAULT_SOLUTIONS = {
  typescript: 'function solve(n: number): boolean {\n  return n > 0;\n}',
  javascript: 'function solve(n) {\n  return n > 0;\n}',
  python: 'def solve(n: int) -> bool:\n    return n > 0',
  cpp: 'bool solve(int n) {\n    return n > 0;\n}',
}

function buildChallengeInput(
  topic: string,
  category: string | null,
  question: GeneratedQuestionItem
) {
  return {
    title: question.title,
    description: question.description,
    difficulty: question.difficulty,
    tags: [topic, category ?? 'Questions Factory', question.style],
    examples: [
      { id: 1, input: 'n = 5', output: 'true', explanation: 'Sample verification case.' },
    ],
    constraints: ['$1 \\le n \\le 10^5$'],
    hints: [
      'Start by identifying the core invariant and edge cases.',
      'Aim for optimal time and space complexity.',
    ],
    initialSolutions: DEFAULT_SOLUTIONS,
    testCases: [{ id: 1, input: 'n = 5', expected: 'true' }],
  }
}

function buildFallbackProblems(
  categoryTitle: string,
  questions: GeneratedQuestionItem[],
  baseId: number
): Problem[] {
  return questions.map((question, idx) => ({
    id: baseId + idx,
    slug: `${question.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${baseId}-${idx}`,
    title: question.title,
    difficulty: question.difficulty,
    category: categoryTitle,
    acceptance: '50.0%',
    solved: false,
    starred: false,
    isAIGenerated: true,
    description: question.description,
    examples: [{ id: 1, input: 'n = 5', output: 'true', explanation: 'Sample verification case.' }],
    constraints: ['$1 \\le n \\le 10^5$'],
    hints: ['Start by identifying the core invariant and edge cases.'],
    tags: [categoryTitle, question.style],
    codeTemplates: DEFAULT_SOLUTIONS,
    testCases: [{ id: 1, input: 'n = 5', expected: 'true' }],
  }))
}

/**
 * Executes final generation from a confirmed draft—persisting either a
 * Marathon Track or attaching questions to an existing/new Category in SQLite.
 */
export function useGenerationExecutor({
  onActivityChange,
  onMarkDraftGenerated,
  onAppendMessage,
  onGenerationComplete,
}: UseGenerationExecutorOptions) {
  const [isGenerating, setIsGenerating] = useState(false)
  const isGeneratingRef = useRef(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestionItem[]>([])
  const [generatedTarget, setGeneratedTarget] = useState<GeneratedTarget | null>(null)

  const [overlayPhase, setOverlayPhase] = useState<GenerationOverlayPhase>('idle')
  const overlayPhaseRef = useRef<GenerationOverlayPhase>('idle')
  const [processStatus, setProcessStatus] = useState<GenerationProcessStatus | null>(null)
  const [isOutputRevealed, setIsOutputRevealed] = useState(false)
  const [isRetryPromptVisible, setIsRetryPromptVisible] = useState(false)
  const [retryImpulseSeq, setRetryImpulseSeq] = useState(0)

  const generationRunIdRef = useRef(0)
  const pendingOutcomeRef = useRef<'done' | 'error' | 'cancelled' | null>(null)
  const pendingTimersRef = useRef<number[]>([])
  const retryResolverRef = useRef<((decision: 'retry' | 'cancel') => void) | null>(null)

  const clearTimers = useCallback(() => {
    for (const timerId of pendingTimersRef.current) {
      window.clearTimeout(timerId)
    }
    pendingTimersRef.current = []
  }, [])

  const resolvePendingRetry = useCallback((decision: 'retry' | 'cancel') => {
    const resolver = retryResolverRef.current
    retryResolverRef.current = null
    setIsRetryPromptVisible(false)
    resolver?.(decision)
  }, [])

  const scheduleTimer = useCallback((fn: () => void, delayMs: number) => {
    const timerId = window.setTimeout(() => {
      pendingTimersRef.current = pendingTimersRef.current.filter((id) => id !== timerId)
      fn()
    }, delayMs)
    pendingTimersRef.current.push(timerId)
  }, [])

  useEffect(
    () => () => {
      clearTimers()
      retryResolverRef.current?.('cancel')
      retryResolverRef.current = null
    },
    [clearTimers]
  )

  const setPhaseSync = useCallback((phase: GenerationOverlayPhase) => {
    overlayPhaseRef.current = phase
    setOverlayPhase(phase)
  }, [])

  const queryClient = useQueryClient()
  const createCategoryMutation = useCreateCategoryMutation()
  const hydrateWorkspace = useSetAtom(hydrateWorkspaceAtom)
  const categories = useAtomValue(categoriesAtom)
  const setCategories = useSetAtom(categoriesAtom)
  const problems = useAtomValue(problemsAtom)
  const setProblems = useSetAtom(problemsAtom)
  const setMarathons = useSetAtom(marathonsAtom)
  const setMarathonSteps = useSetAtom(marathonStepsAtom)
  const selectCategory = useSetAtom(selectCategoryAtom)

  const resetGeneratedOutput = useCallback(() => {
    generationRunIdRef.current += 1
    clearTimers()
    resolvePendingRetry('cancel')
    pendingOutcomeRef.current = null
    isGeneratingRef.current = false
    setIsGenerating(false)
    setPhaseSync('idle')
    setProcessStatus(null)
    setIsOutputRevealed(false)
    setGeneratedTarget(null)
    setGeneratedQuestions([])
  }, [clearTimers, resolvePendingRetry, setPhaseSync])

  const restoreGeneratedOutput = useCallback(
    (questions: GeneratedQuestionItem[], target: GeneratedTarget | null, wasGenerated?: boolean) => {
      generationRunIdRef.current += 1
      clearTimers()
      resolvePendingRetry('cancel')
      pendingOutcomeRef.current = null
      isGeneratingRef.current = false
      setIsGenerating(false)
      setPhaseSync('idle')
      setProcessStatus(null)
      setIsOutputRevealed(Boolean(wasGenerated || questions.length > 0 || target !== null))
      setGeneratedQuestions(questions)
      setGeneratedTarget(target)
    },
    [clearTimers, resolvePendingRetry, setPhaseSync]
  )

  const completeOrbReturn = useCallback(() => {
    if (overlayPhaseRef.current !== 'returning') return
    setPhaseSync('idle')
    setProcessStatus(null)

    const outcome = pendingOutcomeRef.current ?? 'done'
    pendingOutcomeRef.current = null
    isGeneratingRef.current = false
    setIsGenerating(false)

    if (outcome === 'done') {
      setIsOutputRevealed(true)
      // Celebration leap already played while centered; let the happy expression settle after landing
      scheduleTimer(() => {
        onActivityChange('idle')
      }, 360)
      return
    }

    if (outcome === 'cancelled') {
      onActivityChange('idle')
      return
    }

    onActivityChange('error')
    scheduleTimer(() => {
      onActivityChange('idle')
    }, 2200)
  }, [onActivityChange, scheduleTimer, setPhaseSync])

  const openWorkspace = useCallback(() => {
    if (!generatedTarget) return
    selectCategory({
      name: generatedTarget.name,
      isMarathon: generatedTarget.isMarathon,
      startSolving: true,
    })
  }, [generatedTarget, selectCategory])

  const persistDraftOutput = useCallback(
    async (
      targetDraft: GenerationDraft,
      builtQuestions: GeneratedQuestionItem[]
    ): Promise<{
      target: GeneratedTarget
      message: StudioMessage
    }> => {
      const topic = targetDraft.topic ?? 'Custom Practice'

      if (targetDraft.contentType === 'Marathon Track') {
        const title = `${topic} Marathon`
        const stepCount = Math.min(
          Math.max(builtQuestions.length, 1),
          problems.length || builtQuestions.length
        )
        const stepProblems = problems.slice(0, stepCount)

        setMarathons((prev) => [
          {
            id: `marathon-${Date.now()}`,
            title,
            subtitle: `${targetDraft.questionStyle ?? 'Mixed'} · ${targetDraft.difficulty ?? 'Progressive'}`,
            description: `Generated from your Questions Factory draft for ${topic}.`,
            coverIndex: prev.length % 100,
            difficultyRange: targetDraft.difficulty ?? 'Easy - Hard',
            tags: [targetDraft.category ?? 'Practice', topic],
            steps: stepProblems.map((p, idx) => ({
              step: idx + 1,
              problemId: p.id,
              locked: idx > 0,
              completed: p.solved,
            })),
          },
          ...prev,
        ])

        return {
          target: { name: title, isMarathon: true },
          message: {
            id: `assistant-gen-${Date.now()}`,
            from: 'assistant',
            reasoning: `Built ${builtQuestions.length} track items for "${title}" (${targetDraft.difficulty}, ${targetDraft.questionStyle}).`,
            content: `Your **${title}** track with **${builtQuestions.length} questions** is ready.\n\nClick **Open Workspace** in the side panel to start solving.`,
          },
        }
      }

      const existingCategory = findCategoryByTitle(categories, topic)
      const targetTitle = existingCategory?.name ?? topic
      const description = `${targetDraft.category ?? 'Practice'} · ${builtQuestions.length} ${targetDraft.questionStyle ?? 'Mixed'} questions (${targetDraft.difficulty ?? 'Medium'})`

      let resolvedTitle = targetTitle
      let reusedExisting = Boolean(existingCategory)

      if (databaseClient.isAvailable()) {
        const dbResult = await createCategoryMutation.mutateAsync({
          title: targetTitle,
          description,
          challenges: builtQuestions.map((question) =>
            buildChallengeInput(targetTitle, targetDraft.category, question)
          ),
        })
        resolvedTitle = dbResult?.category?.title ?? targetTitle
        reusedExisting = reusedExisting || dbResult?.created === false
      } else {
        const fallbackProblems = buildFallbackProblems(targetTitle, builtQuestions, Date.now())
        const fallbackIds = fallbackProblems.map((p) => p.id)
        setProblems((prev) => [...fallbackProblems, ...prev])

        if (existingCategory) {
          setCategories((prev) =>
            prev.map((cat) =>
              cat.id === existingCategory.id
                ? { ...cat, problemIds: [...cat.problemIds, ...fallbackIds] }
                : cat
            )
          )
        } else {
          setCategories((prev) => [
            {
              id: `cat-${Date.now()}`,
              name: targetTitle,
              description,
              isCustom: true,
              problemIds: fallbackIds,
            },
            ...prev,
          ])
        }
      }

      return {
        target: { name: resolvedTitle, isMarathon: false },
        message: {
          id: `assistant-gen-${Date.now()}`,
          from: 'assistant',
          reasoning: reusedExisting
            ? `Reused existing "${resolvedTitle}" category and saved ${builtQuestions.length} questions (${targetDraft.difficulty}, ${targetDraft.questionStyle}).`
            : `Created "${resolvedTitle}" category and saved ${builtQuestions.length} questions (${targetDraft.difficulty}, ${targetDraft.questionStyle}).`,
          content: reusedExisting
            ? `All **${builtQuestions.length}** questions have been generated and added to your existing **${resolvedTitle}** category.\n\nClick **Open Workspace** in the side panel to start solving.`
            : `All **${builtQuestions.length} ${resolvedTitle}** questions have been generated and saved to your workspace.\n\nClick **Open Workspace** in the side panel to start solving.`,
        },
      }
    },
    [categories, createCategoryMutation, problems, setCategories, setMarathons, setProblems]
  )

  const celebrateAndReturn = useCallback(
    async (
      runId: number,
      targetDraft: GenerationDraft | null,
      builtQuestions: GeneratedQuestionItem[],
      target: GeneratedTarget,
      totalSteps: number
    ) => {
      if (generationRunIdRef.current !== runId) return
      setGeneratedQuestions(builtQuestions)
      onMarkDraftGenerated()
      setGeneratedTarget(target)
      onGenerationComplete?.({ questions: builtQuestions, target })

      // Celebrate in front of the user while the orb is still centered before zooming back
      pendingOutcomeRef.current = 'done'
      onActivityChange('done')
      setProcessStatus({
        stepIndex: totalSteps,
        totalSteps,
        label:
          targetDraft?.contentType === 'Marathon Track' || target.isMarathon
            ? 'Everything is ready — enjoy the run!'
            : 'All set! Your challenges are ready',
        detail: `Prepared ${builtQuestions.length} ${targetDraft?.topic ?? 'practice'} problems for you`,
      })

      await wait(1450)
      if (generationRunIdRef.current !== runId) return

      setPhaseSync('returning')
    },
    [onActivityChange, onGenerationComplete, onMarkDraftGenerated, setPhaseSync]
  )

  const promptFailureAndAwaitDecision = useCallback(
    async (params: {
      runId: number
      stepIndex: number
      totalSteps: number
      failureReason: string
      isSimulatedStumble?: boolean
    }): Promise<'retry' | 'cancel' | 'aborted'> => {
      const { runId, stepIndex, totalSteps, failureReason, isSimulatedStumble } = params
      if (generationRunIdRef.current !== runId) return 'aborted'

      onActivityChange('error')
      setProcessStatus({
        stepIndex,
        totalSteps,
        label: 'Oh no, something tripped me up...',
        detail: isSimulatedStumble
          ? failureReason
          : `Ran into an issue: ${failureReason}`,
      })

      await wait(520)
      if (generationRunIdRef.current !== runId) return 'aborted'

      setIsRetryPromptVisible(true)
      const decision = await new Promise<'retry' | 'cancel'>((resolve) => {
        retryResolverRef.current = resolve
      })
      if (generationRunIdRef.current !== runId) return 'aborted'

      if (decision === 'cancel') {
        if (!isSimulatedStumble && failureReason) {
          onAppendMessage({
            id: `assistant-err-${Date.now()}`,
            from: 'assistant',
            content: `Could not generate that content: ${failureReason}`,
          })
          pendingOutcomeRef.current = 'error'
        } else {
          pendingOutcomeRef.current = 'cancelled'
        }
        setPhaseSync('returning')
        return 'cancel'
      }

      // Optimistic second-chance perk-up choreography before retrying
      setRetryImpulseSeq((prev) => prev + 1)
      onActivityChange('listening')
      setProcessStatus({
        stepIndex: 0,
        totalSteps,
        label: 'Yay! Let me try that again for you...',
        detail: 'Taking a fresh look with full focus',
      })

      await wait(1550)
      if (generationRunIdRef.current !== runId) return 'aborted'
      return 'retry'
    },
    [onActivityChange, onAppendMessage, setPhaseSync]
  )

  const startAgentGeneration = useCallback(
    (initialStatus: GenerationProcessStatus): number => {
      const runId = ++generationRunIdRef.current
      clearTimers()
      resolvePendingRetry('cancel')
      pendingOutcomeRef.current = null
      isGeneratingRef.current = true
      setIsGenerating(true)
      setIsOutputRevealed(false)
      setPhaseSync('preparing')
      setProcessStatus(initialStatus)
      onActivityChange('thinking')
      return runId
    },
    [clearTimers, onActivityChange, resolvePendingRetry, setPhaseSync]
  )

  const updateAgentGenerationStage = useCallback(
    (runId: number, status: GenerationProcessStatus, activity: AIState = 'thinking') => {
      if (generationRunIdRef.current !== runId) return
      setProcessStatus(status)
      onActivityChange(activity)
    },
    [onActivityChange]
  )

  const completeAgentGeneration = useCallback(
    async (
      runId: number,
      payload: {
        targetDraft: GenerationDraft | null
        questions: GeneratedQuestionItem[]
        target: GeneratedTarget
        problemIds?: number[]
        totalSteps?: number
      }
    ) => {
      if (generationRunIdRef.current !== runId) return

      if (databaseClient.isAvailable()) {
        await hydrateWorkspace()
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workspace })
      }

      if (payload.target.isMarathon) {
        const ids = payload.problemIds ?? []
        const steps =
          ids.length > 0
            ? ids.map((pid, idx) => ({
                step: idx + 1,
                problemId: pid,
                locked: idx > 0,
                completed: false,
              }))
            : problems.slice(0, Math.max(payload.questions.length, 1)).map((p, idx) => ({
                step: idx + 1,
                problemId: p.id,
                locked: idx > 0,
                completed: p.solved,
              }))

        if (ids.length > 0) {
          setMarathonSteps(steps)
        }
        setMarathons((prev) => [
          {
            id: `marathon-${Date.now()}`,
            title: payload.target.name,
            subtitle: `${payload.targetDraft?.questionStyle ?? 'Mixed'} · ${payload.targetDraft?.difficulty ?? 'Progressive'}`,
            description: `Generated by Questions Factory for ${payload.targetDraft?.topic ?? payload.target.name}.`,
            coverIndex: prev.length % 100,
            difficultyRange: payload.targetDraft?.difficulty ?? 'Easy - Hard',
            tags: [payload.targetDraft?.category ?? 'Practice', payload.targetDraft?.topic ?? payload.target.name],
            steps,
          },
          ...prev,
        ])
      }

      await celebrateAndReturn(
        runId,
        payload.targetDraft,
        payload.questions,
        payload.target,
        payload.totalSteps ?? 4
      )
    },
    [celebrateAndReturn, hydrateWorkspace, problems, queryClient, setMarathonSteps, setMarathons]
  )

  const failAgentGeneration = useCallback(
    async (runId: number, errorMessage: string, totalSteps = 4) => {
      return promptFailureAndAwaitDecision({
        runId,
        stepIndex: Math.max(1, totalSteps - 1),
        totalSteps,
        failureReason: errorMessage,
        isSimulatedStumble: false,
      })
    },
    [promptFailureAndAwaitDecision]
  )

  const retryGeneration = useCallback(() => {
    resolvePendingRetry('retry')
  }, [resolvePendingRetry])

  const cancelGenerationRetry = useCallback(() => {
    resolvePendingRetry('cancel')
  }, [resolvePendingRetry])

  const executeGeneration = useCallback(
    async (targetDraft: GenerationDraft, options?: ExecuteGenerationOptions) => {
      if (isGeneratingRef.current) return
      const runId = ++generationRunIdRef.current
      clearTimers()
      resolvePendingRetry('cancel')
      pendingOutcomeRef.current = null
      isGeneratingRef.current = true
      setIsGenerating(true)
      setIsOutputRevealed(false)
      setPhaseSync('preparing')

      const builtQuestions = buildGeneratedQuestions(targetDraft)
      const isCancelled = () => generationRunIdRef.current !== runId
      let attempt = 0
      let simulatedFailureUsed = false

      while (!isCancelled()) {
        attempt += 1
        const shouldSimulateFailure = Boolean(options?.isSimulation && !simulatedFailureUsed)
        const stages = buildGenerationProcessStages(targetDraft, {
          isExtendedDemo: Boolean(options?.isSimulation),
          isRetryAttempt: attempt > 1,
        })

        // Show initial stage when entering attempt (attempt > 1 transitions from hopeful bounce)
        const firstStage = stages[0]
        setProcessStatus({
          stepIndex: 0,
          totalSteps: stages.length,
          label: firstStage.label,
          detail: firstStage.detail,
        })
        onActivityChange(firstStage.activity)

        let persistenceOutcome: Promise<
          | { ok: true; data: { target: GeneratedTarget; message: StudioMessage } }
          | { ok: false; error: unknown }
        > | null = null
        let failedOutcome: { ok: false; error: unknown } | null = null

        // Skip writing DB records on scripted failure attempts so retries never duplicate data
        if (!shouldSimulateFailure) {
          persistenceOutcome = persistDraftOutput(targetDraft, builtQuestions).then(
            (data) => ({ ok: true as const, data }),
            (error: unknown) => ({ ok: false as const, error })
          )
          void persistenceOutcome.then((outcome) => {
            if (!outcome.ok) failedOutcome = outcome
          })
        }

        const stageLimit = shouldSimulateFailure ? Math.max(1, stages.length - 1) : stages.length
        for (let idx = 0; idx < stageLimit; idx += 1) {
          if (idx > 0) {
            if (isCancelled()) return
            if (failedOutcome) break
            const stage = stages[idx]
            setProcessStatus({
              stepIndex: idx,
              totalSteps: stages.length,
              label: stage.label,
              detail: stage.detail,
            })
            onActivityChange(stage.activity)
          }
          await wait(stages[idx].durationMs)
        }

        if (isCancelled()) return

        let failureReason: string | null = null
        let isSimulatedStumble = false

        if (shouldSimulateFailure) {
          simulatedFailureUsed = true
          isSimulatedStumble = true
          failureReason = "Give me a second chance and I'll nail this"
        } else if (persistenceOutcome) {
          const outcome = await persistenceOutcome
          if (isCancelled()) return
          if (outcome.ok) {
            const result = outcome.data
            onAppendMessage(result.message)
            await celebrateAndReturn(runId, targetDraft, builtQuestions, result.target, stages.length)
            return
          }
          failureReason =
            outcome.error instanceof Error ? outcome.error.message : String(outcome.error)
        }

        const decision = await promptFailureAndAwaitDecision({
          runId,
          stepIndex: isSimulatedStumble ? Math.max(1, stages.length - 2) : stages.length - 1,
          totalSteps: stages.length,
          failureReason: failureReason ?? 'Unexpected error',
          isSimulatedStumble,
        })
        if (decision !== 'retry') return
      }
    },
    [
      celebrateAndReturn,
      clearTimers,
      onActivityChange,
      onAppendMessage,
      persistDraftOutput,
      promptFailureAndAwaitDecision,
      resolvePendingRetry,
      setPhaseSync,
    ]
  )

  return {
    isGenerating,
    isGeneratingRef,
    overlayPhase,
    processStatus,
    isOutputRevealed,
    isRetryPromptVisible,
    retryImpulseSeq,
    generatedQuestions,
    generatedTarget,
    executeGeneration,
    startAgentGeneration,
    updateAgentGenerationStage,
    completeAgentGeneration,
    failAgentGeneration,
    retryGeneration,
    cancelGenerationRetry,
    completeOrbReturn,
    resetGeneratedOutput,
    restoreGeneratedOutput,
    openWorkspace,
  }
}

