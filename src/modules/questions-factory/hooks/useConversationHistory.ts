import { useCallback, useMemo, useState } from 'react'
import {
  useFactoryConversationsInfiniteQuery,
  useSaveFactoryConversationMutation,
} from '@/shared/hooks/useWorkspaceQueries'
import type { FactoryConversationRecordDto } from '@/shared/types/problem'
import type {
  FactoryConversationSnapshot,
  GeneratedTarget,
  StudioMessage,
} from '../types'
import type { GeneratedQuestionItem, GenerationDraft } from '../utils/draftEngine'

export function createConversationId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function deriveConversationTitle(
  draft: GenerationDraft | null,
  messages: StudioMessage[]
): string {
  if (draft?.topic) {
    const suffix =
      draft.contentType === 'Marathon Track'
        ? ' · Marathon'
        : draft.questionCount
          ? ` · ${draft.questionCount} questions`
          : ''
    return `${draft.topic}${suffix}`
  }

  const firstUserMsg = messages.find((m) => m.from === 'user')?.content.trim()
  if (!firstUserMsg) return 'Untitled Conversation'
  return firstUserMsg.length > 52 ? `${firstUserMsg.slice(0, 49)}...` : firstUserMsg
}

function toSnapshot(dto: FactoryConversationRecordDto): FactoryConversationSnapshot {
  return {
    id: dto.id,
    title: dto.title,
    messages: Array.isArray(dto.messages) ? (dto.messages as unknown as StudioMessage[]) : [],
    draft: (dto.draft as unknown as GenerationDraft | null) ?? null,
    generatedQuestions: Array.isArray(dto.generatedQuestions)
      ? (dto.generatedQuestions as unknown as GeneratedQuestionItem[])
      : [],
    generatedTarget: (dto.generatedTarget as unknown as GeneratedTarget | null) ?? null,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  }
}

/**
 * Manages persisted Questions Factory conversation history with 10-per-page
 * infinite scrolling and atomic snapshot persistence.
 */
export function useConversationHistory() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useFactoryConversationsInfiniteQuery(true)

  const saveMutation = useSaveFactoryConversationMutation()

  const conversations = useMemo<FactoryConversationSnapshot[]>(
    () => (data?.pages ?? []).flatMap((page) => page.items.map(toSnapshot)),
    [data]
  )

  const persistConversation = useCallback(
    async (snapshot: {
      id: string
      messages: StudioMessage[]
      draft: GenerationDraft | null
      generatedQuestions: GeneratedQuestionItem[]
      generatedTarget: GeneratedTarget | null
    }) => {
      if (!snapshot.messages.some((m) => m.from === 'user')) return

      const title = deriveConversationTitle(snapshot.draft, snapshot.messages)
      try {
        await saveMutation.mutateAsync({
          id: snapshot.id,
          title,
          messages: snapshot.messages as unknown as Array<Record<string, unknown>>,
          draft: snapshot.draft as unknown as Record<string, unknown> | null,
          generatedQuestions: snapshot.generatedQuestions as unknown as Array<
            Record<string, unknown>
          >,
          generatedTarget: snapshot.generatedTarget as unknown as Record<
            string,
            unknown
          > | null,
        })
      } catch {
        // Non-blocking history persistence
      }
    },
    [saveMutation]
  )

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  return {
    isHistoryOpen,
    openHistory: () => setIsHistoryOpen(true),
    closeHistory: () => setIsHistoryOpen(false),
    toggleHistory: () => setIsHistoryOpen((prev) => !prev),
    conversations,
    isLoading,
    isFetchingNextPage,
    hasNextPage: Boolean(hasNextPage),
    loadMore,
    persistConversation,
  }
}

