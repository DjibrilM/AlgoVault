import { type ChangeEvent, useCallback, useRef, useState } from 'react'
import { type AIState, useSimulatedAmplitude } from '@/components/ui/smoothui/ai-core'
import type { AIPromptAttachment } from '@/components/ui/smoothui/ai-prompt-input'
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
    generatedQuestions,
    executeGeneration,
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

  const handleSubmit = useCallback(
    async (rawPrompt: string) => {
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

      // Trigger generation immediately when draft is complete and user confirms
      const latestDraft = draftRef.current
      if (latestDraft?.readyToGenerate && !latestDraft.generated && isConfirmationIntent(prompt)) {
        await executeGeneration(latestDraft)
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

      const resetDelay = nextDraft.readyToGenerate ? 1400 : 650
      if (nextDraft.readyToGenerate) {
        updateAiActivity('done')
      }
      setTimeout(() => updateAiActivity('idle'), resetDelay)
    },
    [
      appendMessage,
      attachments,
      executeGeneration,
      flashUpdatedFields,
      isGeneratingRef,
      resetGeneratedOutput,
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
      restoreGeneratedOutput(snapshot.generatedQuestions, snapshot.generatedTarget)

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
    stopAiActivity: () => updateAiActivity('idle'),
  }
}
