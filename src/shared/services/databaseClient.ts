import {
  AICategory,
  FactoryConversationRecordDto,
  FavoriteRecordDto,
  PaginatedFactoryConversationsDto,
  Problem,
  SubmissionRecordDto,
} from '@/shared/types/problem'

const FACTORY_CONVERSATIONS_STORAGE_KEY = 'algovault:factory-conversations:v1'

function readLocalConversations(): FactoryConversationRecordDto[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(FACTORY_CONVERSATIONS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as FactoryConversationRecordDto[]) : []
  } catch {
    return []
  }
}

function writeLocalConversations(items: FactoryConversationRecordDto[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(FACTORY_CONVERSATIONS_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Ignore storage quota errors in web preview
  }
}

interface DbCategoryPayload {
  id: number
  title: string
  description: string
  challenge?: { id: number } | null
}

interface DbChallengePayload {
  id: number
  slug: string
  title: string
  description: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  acceptance: string
  tags: string[]
  examples: Problem['examples']
  constraints: string[]
  testCases: Problem['testCases']
  initialSolution: string
  initialSolutions: Record<string, string> | null
  solution: string
  hints: string[]
  solved: boolean
  starred: boolean
  categoryId: number
  category?: { id: number; title: string } | null
}

export interface WorkspaceDbSnapshot {
  categories: AICategory[]
  problems: Problem[]
  submissions: SubmissionRecordDto[]
}

function mapChallengeToProblem(c: DbChallengePayload): Problem {
  return {
    id: c.id,
    slug: c.slug || `challenge-${c.id}`,
    title: c.title,
    difficulty: c.difficulty || 'Easy',
    category: c.category?.title ?? 'General',
    acceptance: c.acceptance || '50.0%',
    solved: Boolean(c.solved),
    starred: Boolean(c.starred),
    description: c.description,
    examples: Array.isArray(c.examples) ? c.examples : [],
    constraints: Array.isArray(c.constraints) ? c.constraints : [],
    hints: Array.isArray(c.hints) ? c.hints : [],
    tags: Array.isArray(c.tags) ? c.tags : [],
    codeTemplates: {
      typescript: c.initialSolutions?.typescript ?? c.initialSolution ?? '',
      python: c.initialSolutions?.python ?? '',
      javascript: c.initialSolutions?.javascript ?? '',
      cpp: c.initialSolutions?.cpp ?? '',
    },
    solution: c.solution ?? '',
    testCases: Array.isArray(c.testCases) ? c.testCases : [],
  }
}

export const databaseClient = {
  isAvailable(): boolean {
    return typeof window !== 'undefined' && Boolean(window.ipcRenderer?.invoke)
  },

  async getWorkspaceData(): Promise<WorkspaceDbSnapshot | null> {
    if (!this.isAvailable()) return null
    const raw = (await window.ipcRenderer.invoke('db:get-workspace-data')) as {
      categories: DbCategoryPayload[]
      challenges: DbChallengePayload[]
      submissions: SubmissionRecordDto[]
    }

    const problems = (raw.challenges ?? []).map(mapChallengeToProblem)
    const categories: AICategory[] = (raw.categories ?? []).map((cat) => {
      const linkedProblemIds = (raw.challenges ?? [])
        .filter((ch) => ch.categoryId === cat.id)
        .map((ch) => ch.id)

      return {
        id: String(cat.id),
        name: cat.title,
        description: cat.description,
        problemIds: linkedProblemIds,
      }
    })

    return {
      categories,
      problems,
      submissions: raw.submissions ?? [],
    }
  },

  async saveChallengeProgress(payload: {
    challengeId: number
    solution?: string
    solved?: boolean
    starred?: boolean
  }): Promise<void> {
    if (!this.isAvailable()) return
    await window.ipcRenderer.invoke('db:save-challenge-progress', payload)
  },

  async createCategory(payload: {
    title: string
    description: string
    challenge?: {
      title: string
      description: string
      difficulty?: 'Easy' | 'Medium' | 'Hard'
      initialSolutions?: Record<string, string>
      hints?: string[]
      tags?: string[]
      examples?: Array<Record<string, unknown>>
      constraints?: string[]
      testCases?: Array<Record<string, unknown>>
    }
    challenges?: Array<{
      title: string
      description: string
      difficulty?: 'Easy' | 'Medium' | 'Hard'
      initialSolutions?: Record<string, string>
      hints?: string[]
      tags?: string[]
      examples?: Array<Record<string, unknown>>
      constraints?: string[]
      testCases?: Array<Record<string, unknown>>
    }>
  }): Promise<{
    category?: { id: number; title: string; description: string }
    created?: boolean
  } | null> {
    if (!this.isAvailable()) return null
    return (await window.ipcRenderer.invoke('db:create-category', payload)) as {
      category?: { id: number; title: string; description: string }
      created?: boolean
    } | null
  },

  async getSubmissions(challengeId?: number): Promise<SubmissionRecordDto[]> {
    if (!this.isAvailable()) return []
    return (await window.ipcRenderer.invoke(
      'db:get-submissions',
      challengeId
    )) as SubmissionRecordDto[]
  },

  async getFavorites(): Promise<FavoriteRecordDto[]> {
    if (!this.isAvailable()) return []
    return (await window.ipcRenderer.invoke('db:get-favorites')) as FavoriteRecordDto[]
  },

  async toggleFavorite(challengeId: number): Promise<{ favorited: boolean }> {
    if (!this.isAvailable()) return { favorited: false }
    return (await window.ipcRenderer.invoke('db:toggle-favorite', challengeId)) as {
      favorited: boolean
    }
  },

  async getFactoryConversations(
    page = 0,
    limit = 10
  ): Promise<PaginatedFactoryConversationsDto> {
    const safePage = Math.max(Math.trunc(page), 0)
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 50)

    if (this.isAvailable()) {
      return (await window.ipcRenderer.invoke('db:get-factory-conversations', {
        page: safePage,
        limit: safeLimit,
      })) as PaginatedFactoryConversationsDto
    }

    const sorted = [...readLocalConversations()].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    const start = safePage * safeLimit
    const items = sorted.slice(start, start + safeLimit)
    return {
      items,
      page: safePage,
      limit: safeLimit,
      total: sorted.length,
      hasMore: start + safeLimit < sorted.length,
    }
  },

  async saveFactoryConversation(payload: {
    id: string
    title: string
    messages: Array<Record<string, unknown>>
    draft: Record<string, unknown> | null
    generatedQuestions: Array<Record<string, unknown>>
    generatedTarget: Record<string, unknown> | null
  }): Promise<FactoryConversationRecordDto> {
    if (this.isAvailable()) {
      return (await window.ipcRenderer.invoke(
        'db:save-factory-conversation',
        payload
      )) as FactoryConversationRecordDto
    }

    const now = new Date().toISOString()
    const existingList = readLocalConversations()
    const existing = existingList.find((item) => item.id === payload.id)
    const saved: FactoryConversationRecordDto = {
      id: payload.id,
      title: payload.title.trim() || 'Untitled Conversation',
      messages: payload.messages,
      draft: payload.draft,
      generatedQuestions: payload.generatedQuestions,
      generatedTarget: payload.generatedTarget,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    const nextList = [saved, ...existingList.filter((item) => item.id !== payload.id)]
    writeLocalConversations(nextList)
    return saved
  },
}

