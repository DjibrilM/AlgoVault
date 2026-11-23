import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export const QUERY_KEYS = {
  workspace: ['workspace'] as const,
  profile: ['profile'] as const,
  favorites: ['favorites'] as const,
  todos: ['todos'] as const,
  factoryConversations: ['factory-conversations'] as const,
  aiConfig: ['ai-config'] as const,
  aiModels: (provider?: string) => ['ai-models', provider ?? 'active'] as const,
  submissions: (challengeId?: number) =>
    challengeId !== undefined
      ? (['submissions', challengeId] as const)
      : (['submissions'] as const),
}

