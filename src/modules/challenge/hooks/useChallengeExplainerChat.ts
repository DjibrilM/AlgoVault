import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSetAtom } from 'jotai'
import type { AIState } from '@/components/ui/smoothui/ai-core'
import type { AIPromptAttachment } from '@/components/ui/smoothui/ai-prompt-input'
import {
  useAiConfigQuery,
  useAiModelsQuery,
  useSaveAiConfigMutation,
} from '@/shared/hooks/useWorkspaceQueries'
import { aiClient } from '@/shared/services/aiClient'
import { activeNavAtom } from '@/shared/store'
import type { AiProviderId } from '@/shared/types/ai'
import type { Problem, SupportedLang } from '@/shared/types/problem'
import type { StudioMessage } from '@/modules/questions-factory/types'
import { toChallengeContextDto } from '../utils/challengeContext'

function createWelcomeMessage(problem: Problem): StudioMessage {
  return {
    id: `welcome-${problem.id}`,
    from: 'assistant',
    content: `Ask anything about **${problem.title}** — problem intuition, example walkthroughs, constraints, or edge cases.`,
  }
}

function buildOfflineExplanation(problem: Problem, prompt: string): string {
  const firstExample = problem.examples[0]
  const constraintsSummary =
    problem.constraints.length > 0
      ? problem.constraints.map((c) => `- ${c}`).join('\n')
      : '- Check input bounds carefully for empty or single-element cases.'

  const exampleWalkthrough = firstExample
    ? `### Example Walkthrough\n- **Input:** \`${firstExample.input}\`\n- **Expected Output:** \`${firstExample.output}\`${
        firstExample.explanation ? `\n- **Why:** ${firstExample.explanation}` : ''
      }`
    : ''

  const hintsBlock =
    problem.hints.length > 0
      ? `### Key Intuition\n${problem.hints.slice(0, 2).map((h, i) => `${i + 1}. ${h}`).join('\n')}`
      : ''

  return `Here is a structured breakdown for **${problem.title}** *(in response to: "${prompt}")*:

### Goal & Constraints
${constraintsSummary}

${exampleWalkthrough}

${hintsBlock}

> Add your Gemini API key in **API Keys** to ask follow-up questions interactively.`
}

interface UseChallengeExplainerChatOptions {
  problem: Problem
  currentCode?: string
  selectedLang?: SupportedLang
}

/**
 * Manages conversational challenge explanation state per problem,
 * mirroring the Questions Factory studio hook architecture.
 */
export function useChallengeExplainerChat({
  problem,
  currentCode,
  selectedLang,
}: UseChallengeExplainerChatOptions) {
  const [messagesByProblem, setMessagesByProblem] = useState<Record<number, StudioMessage[]>>({})
  const messagesByProblemRef = useRef<Record<number, StudioMessage[]>>({})

  const [promptText, setPromptText] = useState('')
  const [attachments, setAttachments] = useState<AIPromptAttachment[]>([])
  const [aiActivity, setAiActivity] = useState<AIState>('idle')
  const aiActivityRef = useRef<AIState>('idle')
  const [liked, setLiked] = useState<Record<string, boolean>>({})
  const [disliked, setDisliked] = useState<Record<string, boolean>>({})
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const activeRunIdRef = useRef<string | null>(null)
  const activeUnsubscribeRef = useRef<(() => void) | null>(null)
  const resetTimerRef = useRef<number | null>(null)

  const setActiveNav = useSetAtom(activeNavAtom)
  const { data: aiStatus } = useAiConfigQuery()
  const saveAiConfigMutation = useSaveAiConfigMutation()
  const [selectedModelOverride, setSelectedModelOverride] = useState<string | null>(null)
  const [selectedProviderOverride, setSelectedProviderOverride] = useState<AiProviderId | null>(null)
  const activeProvider: AiProviderId = selectedProviderOverride ?? aiStatus?.provider ?? 'google'
  const activeModelId = selectedModelOverride ?? aiStatus?.modelId ?? ''

  const {
    data: availableModels = [],
    isLoading: isModelsInitialLoading,
    isFetching: isModelsFetching,
  } = useAiModelsQuery(activeProvider, aiStatus?.baseUrl)
  const isModelsLoading =
    isModelsInitialLoading || (isModelsFetching && availableModels.length === 0)

  const messages = useMemo(
    () => messagesByProblem[problem.id] ?? [createWelcomeMessage(problem)],
    [messagesByProblem, problem]
  )

  useEffect(() => {
    return () => {
      activeUnsubscribeRef.current?.()
      activeUnsubscribeRef.current = null
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current)
      }
    }
  }, [])

  const updateAiActivity = useCallback((state: AIState) => {
    aiActivityRef.current = state
    setAiActivity(state)
  }, [])

  const setProblemMessages = useCallback(
    (targetProblem: Problem, updater: (current: StudioMessage[]) => StudioMessage[]) => {
      const current =
        messagesByProblemRef.current[targetProblem.id] ?? [createWelcomeMessage(targetProblem)]
      const next = updater(current)
      messagesByProblemRef.current = {
        ...messagesByProblemRef.current,
        [targetProblem.id]: next,
      }
      setMessagesByProblem(messagesByProblemRef.current)
      return next
    },
    []
  )

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

  const handleSubmit = useCallback(
    async (rawPrompt: string) => {
      const prompt = rawPrompt.trim()
      if (!prompt || aiActivityRef.current === 'thinking' || aiActivityRef.current === 'streaming') {
        return
      }

      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current)
        resetTimerRef.current = null
      }

      const targetProblem = problem
      const currentAttachments = attachments
      setAttachments([])
      setPromptText('')

      const historyWithUser = setProblemMessages(targetProblem, (current) => [
        ...current.filter((m) => !m.id.startsWith('welcome')),
        {
          id: `user-${Date.now()}`,
          from: 'user',
          content: prompt,
          attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
        },
      ])

      if (!aiClient.isAvailable() || !aiStatus?.configured) {
        updateAiActivity('thinking')
        resetTimerRef.current = window.setTimeout(() => {
          setProblemMessages(targetProblem, (current) => [
            ...current,
            {
              id: `assistant-${Date.now()}`,
              from: 'assistant',
              content: buildOfflineExplanation(targetProblem, prompt),
            },
          ])
          updateAiActivity('idle')
          resetTimerRef.current = null
        }, 250)
        return
      }

      const runId = `challenge-chat-${targetProblem.id}-${Date.now()}`
      const assistantId = `assistant-${Date.now()}`
      activeRunIdRef.current = runId
      updateAiActivity('thinking')

      setProblemMessages(targetProblem, (current) => [
        ...current,
        {
          id: assistantId,
          from: 'assistant',
          content: '',
          reasoning: '',
          isStreaming: true,
        },
      ])

      activeUnsubscribeRef.current?.()
      const unsubscribe = aiClient.onStreamEvent((event) => {
        if (event.runId !== runId) return

        if (event.type === 'reasoning-delta') {
          setProblemMessages(targetProblem, (current) =>
            current.map((msg) =>
              msg.id === assistantId
                ? { ...msg, reasoning: `${msg.reasoning ?? ''}${event.delta}` }
                : msg
            )
          )
          return
        }

        if (event.type === 'text-delta') {
          updateAiActivity('streaming')
          setProblemMessages(targetProblem, (current) =>
            current.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: `${msg.content}${event.delta}` }
                : msg
            )
          )
        }
      })
      activeUnsubscribeRef.current = unsubscribe

      try {
        const result = await aiClient.runChallengeChat({
          runId,
          problem: toChallengeContextDto(targetProblem),
          prompt,
          messages: historyWithUser.map((m) => ({
            id: m.id,
            from: m.from,
            content: m.content,
            ...(m.reasoning ? { reasoning: m.reasoning } : {}),
          })),
          ...(currentCode ? { currentCode } : {}),
          ...(selectedLang ? { currentLang: selectedLang } : {}),
          ...(activeModelId ? { modelId: activeModelId } : {}),
        })

        if (activeRunIdRef.current === runId) {
          activeRunIdRef.current = null
        }

        if (result.aborted) {
          setProblemMessages(targetProblem, (current) =>
            current.filter((msg) => msg.id !== assistantId || msg.content.trim().length > 0).map((msg) =>
              msg.id === assistantId ? { ...msg, isStreaming: false } : msg
            )
          )
          updateAiActivity('idle')
          return
        }

        setProblemMessages(targetProblem, (current) =>
          current.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: result.text || msg.content,
                  reasoning: result.reasoning || msg.reasoning || undefined,
                  isStreaming: false,
                }
              : msg
          )
        )
        updateAiActivity('done')
        resetTimerRef.current = window.setTimeout(() => {
          updateAiActivity('idle')
          resetTimerRef.current = null
        }, 750)
      } catch (err) {
        if (activeRunIdRef.current === runId) {
          activeRunIdRef.current = null
        }
        const errorMessage = err instanceof Error ? err.message : String(err)
        setProblemMessages(targetProblem, (current) =>
          current.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: `Could not reach the AI provider: ${errorMessage}\n\nYou can inspect or update your model credentials in **Settings**.`,
                  isStreaming: false,
                }
              : msg
          )
        )
        updateAiActivity('error')
        resetTimerRef.current = window.setTimeout(() => {
          updateAiActivity('idle')
          resetTimerRef.current = null
        }, 2000)
      } finally {
        unsubscribe()
        if (activeUnsubscribeRef.current === unsubscribe) {
          activeUnsubscribeRef.current = null
        }
      }
    },
    [
      activeModelId,
      aiStatus?.configured,
      attachments,
      currentCode,
      problem,
      selectedLang,
      setProblemMessages,
      updateAiActivity,
    ]
  )

  const stopAiActivity = useCallback(() => {
    if (activeRunIdRef.current) {
      void aiClient.abortRun(activeRunIdRef.current)
      activeRunIdRef.current = null
    }
    activeUnsubscribeRef.current?.()
    activeUnsubscribeRef.current = null
    setProblemMessages(problem, (current) =>
      current
        .filter((msg) => !msg.isStreaming || msg.content.trim().length > 0)
        .map((msg) => (msg.isStreaming ? { ...msg, isStreaming: false } : msg))
    )
    updateAiActivity('idle')
  }, [problem, setProblemMessages, updateAiActivity])

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

  const effectiveState: AIState =
    aiActivity !== 'idle'
      ? aiActivity
      : promptText.trim().length > 0
        ? 'listening'
        : 'idle'

  return {
    messages,
    promptText,
    setPromptText,
    attachments,
    fileInputRef,
    liked,
    disliked,
    effectiveState,
    aiStatus,
    availableModels,
    isModelsLoading,
    activeProvider,
    activeModelId,
    isSwitchingModel: saveAiConfigMutation.isPending,
    switchModel,
    openAiSettings: () => setActiveNav('settings'),
    handleSubmit,
    stopAiActivity,
    handleFileChange,
    removeAttachment,
    handleToggleLike,
    handleToggleDislike,
    handleCopy,
  }
}
