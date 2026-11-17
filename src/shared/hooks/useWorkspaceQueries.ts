import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/shared/lib/queryClient'
import { databaseClient } from '@/shared/services/databaseClient'
import { aiClient } from '@/shared/services/aiClient'
import { challengeService } from '@/modules/challenge/services/challengeService'
import type { Problem, SupportedLang } from '@/shared/types/problem'
import type { AiProviderId, SaveAiConfigDto } from '@/shared/types/ai'

export function useWorkspaceQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.workspace,
    queryFn: () => databaseClient.getWorkspaceData(),
    enabled: databaseClient.isAvailable(),
  })
}

export function useSubmissionsQuery(challengeId?: number) {
  return useQuery({
    queryKey: QUERY_KEYS.submissions(challengeId),
    queryFn: () => databaseClient.getSubmissions(challengeId),
    enabled: databaseClient.isAvailable(),
  })
}

export function useFavoritesQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.favorites,
    queryFn: () => databaseClient.getFavorites(),
    enabled: databaseClient.isAvailable(),
  })
}

export function useToggleFavoriteMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (challengeId: number) => databaseClient.toggleFavorite(challengeId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.favorites })
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.workspace })
    },
  })
}

export function useSaveChallengeProgressMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      challengeId: number
      solution?: string
      solved?: boolean
      starred?: boolean
    }) => databaseClient.saveChallengeProgress(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.workspace })
    },
  })
}

export function useCreateCategoryMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Parameters<typeof databaseClient.createCategory>[0]) =>
      databaseClient.createCategory(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.workspace })
    },
  })
}

export function useSubmitCodeMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      problem,
      code,
      lang,
    }: {
      problem: Problem
      code: string
      lang: SupportedLang
    }) => {
      const result = await challengeService.submitCode(problem, code, lang)
      await databaseClient.saveChallengeProgress({
        challengeId: problem.id,
        solution: code,
        solved: result.status === 'success' ? true : problem.solved,
      })
      return result
    },
    onSuccess: (_result, variables) => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.workspace })
      void qc.invalidateQueries({ queryKey: ['submissions'] })
      void qc.invalidateQueries({
        queryKey: QUERY_KEYS.submissions(variables.problem.id),
      })
    },
  })
}

export function useFactoryConversationsInfiniteQuery(enabled = true) {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.factoryConversations,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => databaseClient.getFactoryConversations(pageParam, 10),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled,
  })
}

export function useSaveFactoryConversationMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Parameters<typeof databaseClient.saveFactoryConversation>[0]) =>
      databaseClient.saveFactoryConversation(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.factoryConversations })
    },
  })
}

export function useAiConfigQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.aiConfig,
    queryFn: () => aiClient.getConfig(),
    enabled: aiClient.isAvailable(),
  })
}

export function useSaveAiConfigMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SaveAiConfigDto) => aiClient.saveConfig(payload),
    onSuccess: (nextStatus) => {
      qc.setQueryData(QUERY_KEYS.aiConfig, nextStatus)
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.aiConfig })
      void qc.invalidateQueries({ queryKey: ['ai-models'] })
    },
  })
}

export function useAiModelsQuery(provider?: AiProviderId, baseUrl?: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.aiModels(`${provider ?? 'active'}:${baseUrl ?? ''}`),
    queryFn: () =>
      provider
        ? aiClient.listModels({
            provider,
            modelId: '',
            ...(baseUrl !== undefined ? { baseUrl } : {}),
          })
        : aiClient.listModels(),
    enabled,
  })
}

