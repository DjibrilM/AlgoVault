import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/shared/lib/queryClient'
import { databaseClient } from '@/shared/services/databaseClient'
import { aiClient } from '@/shared/services/aiClient'
import { challengeService } from '@/modules/challenge/services/challengeService'
import type {
  CreateTodoInput,
  Problem,
  SaveUserProfileInput,
  SupportedLang,
  TodoRecordDto,
  UserProfileDto,
} from '@/shared/types/problem'
import type { AiProviderId, SaveAiConfigDto } from '@/shared/types/ai'

export function useWorkspaceQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.workspace,
    queryFn: () => databaseClient.getWorkspaceData(),
    enabled: databaseClient.isAvailable(),
  })
}

export function useProfileQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: () => databaseClient.getProfile(),
  })
}

export function useSaveProfileMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SaveUserProfileInput) => databaseClient.saveProfile(payload),
    onSuccess: (saved) => {
      if (saved) {
        qc.setQueryData<UserProfileDto | null>(QUERY_KEYS.profile, saved)
      }
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.profile })
    },
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
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.todos })
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
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.todos })
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
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.todos })
      void qc.invalidateQueries({ queryKey: ['submissions'] })
      void qc.invalidateQueries({
        queryKey: QUERY_KEYS.submissions(variables.problem.id),
      })
    },
  })
}

export function useTodosQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.todos,
    queryFn: () => databaseClient.getTodos(),
  })
}

export function useCreateTodoMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTodoInput) => databaseClient.createTodo(payload),
    onSuccess: (created) => {
      if (created) {
        qc.setQueryData<TodoRecordDto[]>(QUERY_KEYS.todos, (old = []) => [
          created,
          ...old.filter((item) => item.id !== created.id),
        ])
      }
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.todos, refetchType: 'all' })
    },
  })
}

export function useToggleTodoMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => databaseClient.toggleTodo(id),
    onSuccess: (updated, id) => {
      qc.setQueryData<TodoRecordDto[]>(QUERY_KEYS.todos, (old = []) =>
        old.map((item) =>
          item.id === id ? (updated ?? { ...item, completed: !item.completed }) : item
        )
      )
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.todos, refetchType: 'all' })
    },
  })
}

export function useToggleChallengeTodoMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (challengeId: number) => databaseClient.toggleChallengeTodo(challengeId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.todos, refetchType: 'all' })
    },
  })
}

export function useDeleteTodoMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => databaseClient.deleteTodo(id),
    onSuccess: (_res, id) => {
      qc.setQueryData<TodoRecordDto[]>(QUERY_KEYS.todos, (old = []) =>
        old.filter((item) => item.id !== id)
      )
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.todos, refetchType: 'all' })
    },
  })
}

export function useClearCompletedTodosMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => databaseClient.clearCompletedTodos(),
    onSuccess: () => {
      qc.setQueryData<TodoRecordDto[]>(QUERY_KEYS.todos, (old = []) =>
        old.filter((item) => !item.completed)
      )
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.todos, refetchType: 'all' })
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

