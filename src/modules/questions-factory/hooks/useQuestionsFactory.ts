import { type ChangeEvent, useCallback, useRef, useState } from 'react'
import { useSetAtom } from 'jotai'
import { type AIState, useSimulatedAmplitude } from '@/components/ui/smoothui/ai-core'
import type { AIPromptAttachment } from '@/components/ui/smoothui/ai-prompt-input'
import { useAppMenuAction } from '@/shared'
import {
  useAiConfigQuery,
  useAiModelsQuery,
  useSaveAiConfigMutation,
} from '@/shared/hooks/useWorkspaceQueries'
import { aiClient } from '@/shared/services/aiClient'
import { activeNavAtom } from '@/shared/store'
import type { AiAgentRole, AiProviderId } from '@/shared/types/ai'
import type {
  FactoryConversationSnapshot,
  GeneratedTarget,
  StudioMessage,
} from '../types'
import {
  buildClarificationResponse,
  type DraftFieldKey,
  extractDraftUpdates,
  type GeneratedQuestionItem,
  type GenerationDraft,
  isConfirmationIntent,
  isRejectionIntent,
} from '../utils/draftEngine'
import { createConversationId, useConversationHistory } from './useConversationHistory'
import { useGenerationExecutor } from './useGenerationExecutor'
import { usePipelineSimulation } from './usePipelineSimulation'

const WELCOME_MESSAGE: StudioMessage = {
  id: 'welcome',
  from: 'assistant',
  content:
    'Welcome to **Questions Factory**. Tell me what you would like to practice or build, and we will shape the generation draft together before creating your challenges.',
}

const FALLBACK_GUIDANCE_MESSAGE =
  'Tell me a topic or goal — for example *"I want to practice some Linked List problems"* or *"Build a Graph Traversal marathon"* — and I will start shaping a generation draft with you.'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Coordinates Questions Factory state: conversation messages, attachments,
 * draft shaping, orb activity, feedback actions, generation, simulation, and history.
 */
export function useQuestionsFactory() {
  const [activeConversationId, setActiveConversationId] = useState(createConversationId)
  const conversationIdRef = useRef(activeConversationId)

  const [messages, setMessages] = useState<StudioMessage[]>([WELCOME_MESSAGE])
  const messagesRef = useRef<StudioMessage[]>(messages)

  const [promptText, setPromptText] = useState('')
  const [aiActivity, setAiActivity] = useState<AIState>('idle')
  const aiActivityRef = useRef<AIState>('idle')

  const [attachments, setAttachments] = useState<AIPromptAttachment[]>([])
  const [draft, setDraft] = useState<GenerationDraft | null>(null)
  const draftRef = useRef<GenerationDraft | null>(null)

  const generatedQuestionsRef = useRef<GeneratedQuestionItem[]>([])
  const generatedTargetRef = useRef<GeneratedTarget | null>(null)

  const [highlightedFields, setHighlightedFields] = useState<DraftFieldKey[]>([])
  const [liked, setLiked] = useState<Record<string, boolean>>({})
  const [disliked, setDisliked] = useState<Record<string, boolean>>({})
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const activeAiRunIdRef = useRef<string | null>(null)
  const setActiveNav = useSetAtom(activeNavAtom)
  const { data: aiStatus } = useAiConfigQuery()
  const saveAiConfigMutation = useSaveAiConfigMutation()
  const [selectedModelOverride, setSelectedModelOverride] = useState<string | null>(null)
  const [selectedProviderOverride, setSelectedProviderOverride] = useState<AiProviderId | null>(null)
  const activeProvider: AiProviderId = selectedProviderOverride ?? aiStatus?.provider ?? 'gateway'
  const activeModelId = selectedModelOverride ?? aiStatus?.modelId ?? ''
  const {
    data: availableModels = [],
    isLoading: isModelsInitialLoading,
    isFetching: isModelsFetching,
  } = useAiModelsQuery(activeProvider, aiStatus?.baseUrl)
  const isModelsLoading =
    isModelsInitialLoading || (isModelsFetching && availableModels.length === 0)

  const switchModel = useCallback(
    async (nextModelId: string, nextProvider?: AiProviderId) => {
      const trimmed = nextModelId.trim()
      const targetProvider = nextProvider ?? activeProvider
      if (!trimmed || (trimmed === activeModelId && targetProvider === activeProvider)) return
      setSelectedModelOverride(trimmed)
      setSelectedProviderOverride(targetProvider)

      if (aiClient.isAvailable()) {
        try {
          await saveAiConfigMutation.mutateAsync({
            provider: targetProvider,
            modelId: trimmed,
            ...(targetProvider === aiStatus?.provider && aiStatus?.baseUrl !== undefined
              ? { baseUrl: aiStatus.baseUrl }
              : {}),
          })
          setSelectedModelOverride(null)
          setSelectedProviderOverride(null)
        } catch {
          // Keep in-session override even if saving fails
        }
      }
    },
    [activeModelId, activeProvider, aiStatus?.baseUrl, aiStatus?.provider, saveAiConfigMutation]
  )

  const {
    isHistoryOpen,
    toggleHistory,
    closeHistory,
    conversations,
    isLoading: isHistoryLoading,
    isFetchingNextPage: isLoadingMoreHistory,
    hasNextPage: hasMoreHistory,
    loadMore: loadMoreHistory,
    persistConversation,
  } = useConversationHistory()

  const syncSnapshot = useCallback(
    (overrides?: {
      messages?: StudioMessage[]
      draft?: GenerationDraft | null
      generatedQuestions?: GeneratedQuestionItem[]
      generatedTarget?: GeneratedTarget | null
    }) => {
      void persistConversation({
        id: conversationIdRef.current,
        messages: overrides?.messages ?? messagesRef.current,
        draft: overrides?.draft !== undefined ? overrides.draft : draftRef.current,
        generatedQuestions: overrides?.generatedQuestions ?? generatedQuestionsRef.current,
        generatedTarget:
          overrides?.generatedTarget !== undefined
            ? overrides.generatedTarget
            : generatedTargetRef.current,
      })
    },
    [persistConversation]
  )

  const updateAiActivity = useCallback((state: AIState) => {
    aiActivityRef.current = state
    setAiActivity(state)
  }, [])

  const appendMessage = useCallback((message: StudioMessage): StudioMessage[] => {
    const next = [...messagesRef.current, message]
    messagesRef.current = next
    setMessages(next)
    return next
  }, [])

  const updateMessageById = useCallback(
    (id: string, updater: (msg: StudioMessage) => StudioMessage): StudioMessage[] => {
      const next = messagesRef.current.map((msg) => (msg.id === id ? updater(msg) : msg))
      messagesRef.current = next
      setMessages(next)
      return next
    },
    []
  )

  const removeMessageById = useCallback((id: string): StudioMessage[] => {
    const next = messagesRef.current.filter((msg) => msg.id !== id)
    messagesRef.current = next
    setMessages(next)
    return next
  }, [])

  const markDraftGenerated = useCallback(() => {
    const next = draftRef.current ? { ...draftRef.current, generated: true } : draftRef.current
    draftRef.current = next
    setDraft(next)
  }, [])

  const handleGenerationComplete = useCallback(
    ({
      questions,
      target,
    }: {
      questions: GeneratedQuestionItem[]
      target: GeneratedTarget
    }) => {
      generatedQuestionsRef.current = questions
      generatedTargetRef.current = target
      syncSnapshot({
        generatedQuestions: questions,
        generatedTarget: target,
      })
    },
    [syncSnapshot]
  )

  const {
    isGenerating,
    isGeneratingRef,
    overlayPhase,
    processStatus,
    isOutputRevealed,
    isRetryPromptVisible,
    retryImpulseSeq,
    generatedQuestions,
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
  } = useGenerationExecutor({
    onActivityChange: updateAiActivity,
    onMarkDraftGenerated: markDraftGenerated,
    onAppendMessage: appendMessage,
    onGenerationComplete: handleGenerationComplete,
  })

  const flashUpdatedFields = useCallback((fields: DraftFieldKey[]) => {
    if (fields.length === 0) return
    setHighlightedFields(fields)
    setTimeout(() => {
      setHighlightedFields([])
    }, 1400)
  }, [])

  const runLiveAiTurn = useCallback(
    async (prompt: string, historyForRun: StudioMessage[], initialDraft: GenerationDraft | null) => {
      const willForceGenerate = Boolean(
        initialDraft?.readyToGenerate && !initialDraft.generated && isConfirmationIntent(prompt)
      )

      const baseDraft = initialDraft?.generated ? null : initialDraft
      if (initialDraft?.generated) {
        generatedQuestionsRef.current = []
        generatedTargetRef.current = null
        resetGeneratedOutput()
      }

      let currentDraftForRetry = baseDraft
      let attempt = 0
      let executorRunId: number | null = null
      let shouldContinue = true

      if (willForceGenerate) {
        executorRunId = startAgentGeneration({
          stepIndex: 0,
          totalSteps: 4,
          label: `Let me prepare your ${baseDraft?.topic ?? 'Custom Practice'}...`,
          detail: 'Coordinating specialized agents to craft your challenges',
        })
      }

      while (shouldContinue) {
        shouldContinue = false
        attempt += 1
        const runId = `ai-run-${Date.now()}-${attempt}`
        activeAiRunIdRef.current = runId
        const assistantId = `assistant-${Date.now()}`

        if (!executorRunId) {
          updateAiActivity('thinking')
        }

        appendMessage({
          id: assistantId,
          from: 'assistant',
          content: '',
          reasoning: '',
          isStreaming: true,
        })

        const stageStepMap: Record<AiAgentRole, number> = {
          master: 0,
          'catalog-analyst': 1,
          'challenge-architect': 2,
          'challenge-verifier': 3,
        }

        const unsubscribe = aiClient.onStreamEvent((event) => {
          if (event.runId !== runId) return

          if (event.type === 'reasoning-delta') {
            updateMessageById(assistantId, (msg) => ({
              ...msg,
              reasoning: `${msg.reasoning ?? ''}${event.delta}`,
            }))
            return
          }

          if (event.type === 'text-delta') {
            if (!executorRunId) {
              updateAiActivity('streaming')
            }
            updateMessageById(assistantId, (msg) => ({
              ...msg,
              content: `${msg.content}${event.delta}`,
            }))
            return
          }

          if (event.type === 'draft-updated') {
            draftRef.current = event.draft
            currentDraftForRetry = event.draft
            setDraft(event.draft)
            flashUpdatedFields(event.updatedFields)
            return
          }

          if (event.type === 'agent-stage') {
            const isOrchestratedStage =
              event.agent === 'catalog-analyst' ||
              event.agent === 'challenge-architect' ||
              event.agent === 'challenge-verifier' ||
              event.toolName === 'saveChallengeSet'

            if (isOrchestratedStage && !executorRunId) {
              executorRunId = startAgentGeneration({
                stepIndex: stageStepMap[event.agent] ?? 0,
                totalSteps: 4,
                label: event.label,
                detail: event.detail,
              })
            } else if (executorRunId) {
              const stepIdx =
                event.toolName === 'saveChallengeSet' ? 3 : (stageStepMap[event.agent] ?? 1)
              updateAgentGenerationStage(
                executorRunId,
                {
                  stepIndex: stepIdx,
                  totalSteps: 4,
                  label: event.label,
                  detail: event.detail,
                },
                event.agent === 'challenge-verifier' || event.toolName === 'saveChallengeSet'
                  ? 'streaming'
                  : 'thinking'
              )
            }
          }
        })

        try {
          const result = await aiClient.runStudioTurn({
            runId,
            prompt,
            messages: historyForRun.map((m) => ({
              id: m.id,
              from: m.from,
              content: m.content,
              ...(m.reasoning ? { reasoning: m.reasoning } : {}),
            })),
            draft: currentDraftForRetry,
            forceGenerate: willForceGenerate,
            ...(activeModelId ? { modelId: activeModelId } : {}),
          })

          if (activeAiRunIdRef.current === runId) {
            activeAiRunIdRef.current = null
          }

          if (result.aborted) {
            removeMessageById(assistantId)
            updateAiActivity('idle')
            return
          }

          const finalMessages = updateMessageById(assistantId, (msg) => ({
            ...msg,
            content: result.text || msg.content,
            reasoning: result.reasoning || msg.reasoning || undefined,
            isStreaming: false,
          }))

          const nextDraft = result.draft ?? draftRef.current
          if (nextDraft) {
            draftRef.current = nextDraft
            setDraft(nextDraft)
          }
          if (result.updatedFields.length > 0) {
            flashUpdatedFields(result.updatedFields)
          }

          if (result.generatedQuestions && result.generatedTarget) {
            const targetRunId =
              executorRunId ??
              startAgentGeneration({
                stepIndex: 3,
                totalSteps: 4,
                label: 'Almost there, wiring everything in...',
                detail: `Preparing ${result.generatedQuestions.length} challenges`,
              })

            syncSnapshot({
              messages: finalMessages,
              draft: nextDraft,
              generatedQuestions: result.generatedQuestions,
              generatedTarget: result.generatedTarget,
            })

            await completeAgentGeneration(targetRunId, {
              targetDraft: nextDraft,
              questions: result.generatedQuestions,
              target: result.generatedTarget,
              problemIds: result.generatedProblemIds,
              totalSteps: 4,
            })
            return
          }

          syncSnapshot({ messages: finalMessages, draft: nextDraft })
          const resetDelay = nextDraft?.readyToGenerate ? 1600 : 750
          if (nextDraft?.readyToGenerate) {
            updateAiActivity('done')
          }
          setTimeout(() => updateAiActivity('idle'), resetDelay)
          return
        } catch (err) {
          if (activeAiRunIdRef.current === runId) {
            activeAiRunIdRef.current = null
          }
          const errorMessage = err instanceof Error ? err.message : String(err)

          if (executorRunId) {
            removeMessageById(assistantId)
            const decision = await failAgentGeneration(executorRunId, errorMessage, 4)
            if (decision === 'retry') {
              shouldContinue = true
              continue
            }
            return
          }

          updateMessageById(assistantId, (msg) => ({
            ...msg,
            content: `Could not reach the AI provider: ${errorMessage}\n\nYou can inspect or update your model credentials in **Settings**.`,
            isStreaming: false,
          }))
          updateAiActivity('error')
          setTimeout(() => updateAiActivity('idle'), 2000)
          return
        } finally {
          unsubscribe()
        }
      }
    },
    [
      activeModelId,
      appendMessage,
      completeAgentGeneration,
      failAgentGeneration,
      flashUpdatedFields,
      removeMessageById,
      resetGeneratedOutput,
      startAgentGeneration,
      syncSnapshot,
      updateAgentGenerationStage,
      updateAiActivity,
      updateMessageById,
    ]
  )

  const handleSubmit = useCallback(
    async (rawPrompt: string, options?: { isSimulation?: boolean }) => {
      const prompt = rawPrompt.trim()
      if (!prompt || aiActivityRef.current === 'thinking' || isGeneratingRef.current) return

      const currentAttachments = attachments
      setAttachments([])
      setPromptText('')

      const afterUser = appendMessage({
        id: `user-${Date.now()}`,
        from: 'user',
        content: prompt,
        attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      })
      syncSnapshot({ messages: afterUser })

      const latestDraft = draftRef.current

      // Use real Vercel AI SDK agent pipeline when configured (keep simulation deterministic)
      if (!options?.isSimulation && aiClient.isAvailable() && aiStatus?.configured) {
        await runLiveAiTurn(prompt, afterUser, latestDraft)
        return
      }

      // Offline / simulation path: execute local draft shaping & generation
      if (latestDraft?.readyToGenerate && !latestDraft.generated && isConfirmationIntent(prompt)) {
        await executeGeneration(latestDraft, { isSimulation: options?.isSimulation })
        return
      }

      updateAiActivity('thinking')
      await wait(420)

      // Start fresh draft if previous one was already generated
      const baseDraft = latestDraft?.generated ? null : latestDraft
      if (latestDraft?.generated) {
        generatedQuestionsRef.current = []
        generatedTargetRef.current = null
        resetGeneratedOutput()
      }

      const { draft: nextDraft, updatedFields, hasGenerationIntent } = extractDraftUpdates(
        prompt,
        baseDraft
      )

      if (
        latestDraft?.readyToGenerate &&
        !latestDraft.generated &&
        isRejectionIntent(prompt) &&
        updatedFields.length === 0
      ) {
        updateAiActivity('streaming')
        const afterReject = appendMessage({
          id: `assistant-${Date.now()}`,
          from: 'assistant',
          reasoning: 'User declined creation; keeping current draft open for adjustments.',
          content:
            'No problem — I have not created the questions yet. Tell me what you would like to change in the draft, or reply **Yes** whenever you want me to create them.',
        })
        syncSnapshot({ messages: afterReject })
        setTimeout(() => updateAiActivity('idle'), 500)
        return
      }

      if (!hasGenerationIntent || !nextDraft) {
        updateAiActivity('streaming')
        const afterFallback = appendMessage({
          id: `assistant-${Date.now()}`,
          from: 'assistant',
          content: FALLBACK_GUIDANCE_MESSAGE,
        })
        syncSnapshot({ messages: afterFallback, draft: baseDraft })
        setTimeout(() => updateAiActivity('idle'), 500)
        return
      }

      draftRef.current = nextDraft
      setDraft(nextDraft)
      flashUpdatedFields(updatedFields)

      if (updatedFields.length > 0) {
        updateAiActivity('streaming')
      }

      const { message, reasoning } = buildClarificationResponse(nextDraft, updatedFields)
      const afterAssistant = appendMessage({
        id: `assistant-${Date.now()}`,
        from: 'assistant',
        reasoning,
        content: message,
      })
      syncSnapshot({ messages: afterAssistant, draft: nextDraft })

      const resetDelay = nextDraft.readyToGenerate ? 1850 : 850
      if (nextDraft.readyToGenerate) {
        updateAiActivity('done')
      }
      setTimeout(() => updateAiActivity('idle'), resetDelay)
    },
    [
      aiStatus?.configured,
      appendMessage,
      attachments,
      executeGeneration,
      flashUpdatedFields,
      isGeneratingRef,
      resetGeneratedOutput,
      runLiveAiTurn,
      syncSnapshot,
      updateAiActivity,
    ]
  )

  const resetSession = useCallback(() => {
    const freshId = createConversationId()
    conversationIdRef.current = freshId
    setActiveConversationId(freshId)
    generatedQuestionsRef.current = []
    generatedTargetRef.current = null
    resetGeneratedOutput()
    draftRef.current = null
    setDraft(null)
    setHighlightedFields([])
    updateAiActivity('idle')
    setPromptText('')
    const initialMessages = [WELCOME_MESSAGE]
    messagesRef.current = initialMessages
    setMessages(initialMessages)
  }, [resetGeneratedOutput, updateAiActivity])

  const { isSimulating, runSimulation, stopSimulation } = usePipelineSimulation({
    onResetSession: resetSession,
    onSetPromptText: setPromptText,
    onSubmitStep: handleSubmit,
  })

  const handleStopSimulation = useCallback(() => {
    stopSimulation()
    updateAiActivity('idle')
  }, [stopSimulation, updateAiActivity])

  const resumeConversation = useCallback(
    (snapshot: FactoryConversationSnapshot) => {
      stopSimulation()
      updateAiActivity('idle')
      setPromptText('')
      setAttachments([])
      setHighlightedFields([])

      conversationIdRef.current = snapshot.id
      setActiveConversationId(snapshot.id)

      const restoredMessages =
        snapshot.messages.length > 0 ? snapshot.messages : [WELCOME_MESSAGE]
      messagesRef.current = restoredMessages
      setMessages(restoredMessages)

      draftRef.current = snapshot.draft
      setDraft(snapshot.draft)

      generatedQuestionsRef.current = snapshot.generatedQuestions
      generatedTargetRef.current = snapshot.generatedTarget
      restoreGeneratedOutput(
        snapshot.generatedQuestions,
        snapshot.generatedTarget,
        Boolean(snapshot.draft?.generated)
      )

      closeHistory()
    },
    [closeHistory, restoreGeneratedOutput, stopSimulation, updateAiActivity]
  )

  const startNewConversation = useCallback(() => {
    stopSimulation()
    resetSession()
    setAttachments([])
    closeHistory()
  }, [closeHistory, resetSession, stopSimulation])

  useAppMenuAction((action) => {
    if (action === 'new-questions-studio' && !isGeneratingRef.current) {
      startNewConversation()
    }
  })

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    const next: AIPromptAttachment[] = files.map((file, idx) => ({
      id: `${Date.now()}-${idx}-${file.name}`,
      name: file.name,
      size: file.size,
    }))
    setAttachments((prev) => [...prev, ...next])
    e.target.value = ''
  }, [])

  const removeAttachment = useCallback((id: string) => {
    setAttachments((current) => current.filter((item) => item.id !== id))
  }, [])

  const handleToggleLike = useCallback((id: string) => {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const handleToggleDislike = useCallback((id: string) => {
    setDisliked((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const handleCopy = useCallback((content: string) => {
    void navigator.clipboard.writeText(content)
  }, [])

  // Synchronize orb state: enter 'listening' while idle with non-empty prompt input
  const effectiveOrbState: AIState =
    aiActivity !== 'idle'
      ? aiActivity
      : promptText.trim().length > 0
        ? 'listening'
        : 'idle'
  const amplitude = useSimulatedAmplitude(effectiveOrbState)

  return {
    activeConversationId,
    messages,
    promptText,
    setPromptText,
    attachments,
    fileInputRef,
    draft,
    highlightedFields,
    isGenerating,
    generationOverlayPhase: overlayPhase,
    generationProcessStatus: processStatus,
    isOutputRevealed,
    isRetryPromptVisible,
    retryImpulseSeq,
    retryGeneration,
    cancelGenerationRetry,
    completeOrbReturn,
    generatedQuestions,
    isSimulating,
    liked,
    disliked,
    effectiveOrbState,
    amplitude,
    isHistoryOpen,
    conversations,
    isHistoryLoading,
    isLoadingMoreHistory,
    hasMoreHistory,
    toggleHistory,
    closeHistory,
    loadMoreHistory,
    resumeConversation,
    startNewConversation,
    handleSubmit,
    handleFileChange,
    removeAttachment,
    handleToggleLike,
    handleToggleDislike,
    handleCopy,
    openWorkspace,
    runSimulation,
    stopSimulation: handleStopSimulation,
    stopAiActivity: () => {
      if (activeAiRunIdRef.current) {
        void aiClient.abortRun(activeAiRunIdRef.current)
        activeAiRunIdRef.current = null
      }
      updateAiActivity('idle')
    },
    aiStatus,
    availableModels,
    isModelsLoading,
    activeProvider,
    activeModelId,
    switchModel,
    isSwitchingModel: saveAiConfigMutation.isPending,
    openAiSettings: () => setActiveNav('settings'),
  }
}
