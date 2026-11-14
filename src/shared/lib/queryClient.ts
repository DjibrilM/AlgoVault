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
  favorites: ['favorites'] as const,
  factoryConversations: ['factory-conversations'] as const,
  submissions: (challengeId?: number) =>
    challengeId !== undefined
      ? (['submissions', challengeId] as const)
      : (['submissions'] as const),
}

