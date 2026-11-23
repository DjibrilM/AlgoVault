import {
  AICategory,
  CreateTodoInput,
  FactoryConversationRecordDto,
  FavoriteRecordDto,
  PaginatedFactoryConversationsDto,
  Problem,
  SaveUserProfileInput,
  SubmissionRecordDto,
  TodoRecordDto,
  UserProfileDto,
} from "@/shared/types/problem";

const FACTORY_CONVERSATIONS_STORAGE_KEY = "algovault:factory-conversations:v1";
const TODOS_STORAGE_KEY = "algovault:todos:v1";
const PROFILE_STORAGE_KEY = "algovault:profile:v1";

function readLocalJson<T>(storageKey: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeLocalJson<T>(storageKey: string, items: T[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors in web preview
  }
}

function readLocalConversations(): FactoryConversationRecordDto[] {
  return readLocalJson<FactoryConversationRecordDto>(
    FACTORY_CONVERSATIONS_STORAGE_KEY,
  );
}

function writeLocalConversations(items: FactoryConversationRecordDto[]): void {
  writeLocalJson(FACTORY_CONVERSATIONS_STORAGE_KEY, items);
}

function readLocalTodos(): TodoRecordDto[] {
  return readLocalJson<Partial<TodoRecordDto>>(TODOS_STORAGE_KEY).map(
    (item) => ({
      id: typeof item.id === "number" ? item.id : Date.now(),
      title: typeof item.title === "string" ? item.title : "Untitled Activity",
      notes: typeof item.notes === "string" ? item.notes : null,
      importance:
        item.importance === "low" ||
        item.importance === "medium" ||
        item.importance === "high" ||
        item.importance === "critical"
          ? item.importance
          : "medium",
      deadline: typeof item.deadline === "string" ? item.deadline : null,
      challengeId:
        typeof item.challengeId === "number" ? item.challengeId : null,
      completed: Boolean(item.completed),
      challenge: item.challenge ?? null,
      createdAt:
        typeof item.createdAt === "string"
          ? item.createdAt
          : new Date().toISOString(),
      updatedAt:
        typeof item.updatedAt === "string"
          ? item.updatedAt
          : new Date().toISOString(),
    }),
  );
}

function writeLocalTodos(items: TodoRecordDto[]): void {
  writeLocalJson(TODOS_STORAGE_KEY, items);
}

interface DbCategoryPayload {
  id: number;
  title: string;
  description: string;
  challenge?: { id: number } | null;
}

interface DbChallengePayload {
  id: number;
  slug: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  acceptance: string;
  tags: string[];
  examples: Problem["examples"];
  constraints: string[];
  testCases: Problem["testCases"];
  initialSolution: string;
  initialSolutions: Record<string, string> | null;
  solution: string;
  hints: string[];
  solved: boolean;
  starred: boolean;
  categoryId: number;
  category?: { id: number; title: string } | null;
}

export interface WorkspaceDbSnapshot {
  categories: AICategory[];
  problems: Problem[];
  submissions: SubmissionRecordDto[];
}

function mapChallengeToProblem(c: DbChallengePayload): Problem {
  return {
    id: c.id,
    slug: c.slug || `challenge-${c.id}`,
    title: c.title,
    difficulty: c.difficulty || "Easy",
    category: c.category?.title ?? "General",
    acceptance: c.acceptance || "50.0%",
    solved: Boolean(c.solved),
    starred: Boolean(c.starred),
    description: c.description,
    examples: Array.isArray(c.examples) ? c.examples : [],
    constraints: Array.isArray(c.constraints) ? c.constraints : [],
    hints: Array.isArray(c.hints) ? c.hints : [],
    tags: Array.isArray(c.tags) ? c.tags : [],
    codeTemplates: {
      typescript: c.initialSolutions?.typescript ?? c.initialSolution ?? "",
      python: c.initialSolutions?.python ?? "",
      javascript: c.initialSolutions?.javascript ?? "",
      cpp: c.initialSolutions?.cpp ?? "",
    },
    solution: c.solution ?? "",
    testCases: Array.isArray(c.testCases) ? c.testCases : [],
  };
}

export const databaseClient = {
  isAvailable(): boolean {
    return typeof window !== "undefined" && Boolean(window.ipcRenderer?.invoke);
  },

  async getWorkspaceData(): Promise<WorkspaceDbSnapshot | null> {
    if (!this.isAvailable()) return null;
    const raw = (await window.ipcRenderer.invoke("db:get-workspace-data")) as {
      categories: DbCategoryPayload[];
      challenges: DbChallengePayload[];
      submissions: SubmissionRecordDto[];
    };

    const problems = (raw.challenges ?? []).map(mapChallengeToProblem);
    const categories: AICategory[] = (raw.categories ?? []).map((cat) => {
      const linkedProblemIds = (raw.challenges ?? [])
        .filter((ch) => ch.categoryId === cat.id)
        .map((ch) => ch.id);

      return {
        id: String(cat.id),
        name: cat.title,
        description: cat.description,
        problemIds: linkedProblemIds,
      };
    });

    return {
      categories,
      problems,
      submissions: raw.submissions ?? [],
    };
  },

  async saveChallengeProgress(payload: {
    challengeId: number;
    solution?: string;
    solved?: boolean;
    starred?: boolean;
  }): Promise<void> {
    if (!this.isAvailable()) return;
    await window.ipcRenderer.invoke("db:save-challenge-progress", payload);
  },

  async createCategory(payload: {
    title: string;
    description: string;
    challenge?: {
      title: string;
      description: string;
      difficulty?: "Easy" | "Medium" | "Hard";
      initialSolutions?: Record<string, string>;
      hints?: string[];
      tags?: string[];
      examples?: Array<Record<string, unknown>>;
      constraints?: string[];
      testCases?: Array<Record<string, unknown>>;
    };
    challenges?: Array<{
      title: string;
      description: string;
      difficulty?: "Easy" | "Medium" | "Hard";
      initialSolutions?: Record<string, string>;
      hints?: string[];
      tags?: string[];
      examples?: Array<Record<string, unknown>>;
      constraints?: string[];
      testCases?: Array<Record<string, unknown>>;
    }>;
  }): Promise<{
    category?: { id: number; title: string; description: string };
    created?: boolean;
  } | null> {
    if (!this.isAvailable()) return null;
    return (await window.ipcRenderer.invoke("db:create-category", payload)) as {
      category?: { id: number; title: string; description: string };
      created?: boolean;
    } | null;
  },

  async getSubmissions(challengeId?: number): Promise<SubmissionRecordDto[]> {
    if (!this.isAvailable()) return [];
    return (await window.ipcRenderer.invoke(
      "db:get-submissions",
      challengeId,
    )) as SubmissionRecordDto[];
  },

  async getFavorites(): Promise<FavoriteRecordDto[]> {
    if (!this.isAvailable()) return [];
    return (await window.ipcRenderer.invoke(
      "db:get-favorites",
    )) as FavoriteRecordDto[];
  },

  async toggleFavorite(challengeId: number): Promise<{ favorited: boolean }> {
    if (!this.isAvailable()) return { favorited: false };
    return (await window.ipcRenderer.invoke(
      "db:toggle-favorite",
      challengeId,
    )) as {
      favorited: boolean;
    };
  },

  async getFactoryConversations(
    page = 0,
    limit = 10,
  ): Promise<PaginatedFactoryConversationsDto> {
    const safePage = Math.max(Math.trunc(page), 0);
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 50);

    if (this.isAvailable()) {
      return (await window.ipcRenderer.invoke("db:get-factory-conversations", {
        page: safePage,
        limit: safeLimit,
      })) as PaginatedFactoryConversationsDto;
    }

    const sorted = [...readLocalConversations()].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    const start = safePage * safeLimit;
    const items = sorted.slice(start, start + safeLimit);
    return {
      items,
      page: safePage,
      limit: safeLimit,
      total: sorted.length,
      hasMore: start + safeLimit < sorted.length,
    };
  },

  async saveFactoryConversation(payload: {
    id: string;
    title: string;
    messages: Array<Record<string, unknown>>;
    draft: Record<string, unknown> | null;
    generatedQuestions: Array<Record<string, unknown>>;
    generatedTarget: Record<string, unknown> | null;
  }): Promise<FactoryConversationRecordDto> {
    if (this.isAvailable()) {
      return (await window.ipcRenderer.invoke(
        "db:save-factory-conversation",
        payload,
      )) as FactoryConversationRecordDto;
    }

    const now = new Date().toISOString();
    const existingList = readLocalConversations();
    const existing = existingList.find((item) => item.id === payload.id);
    const saved: FactoryConversationRecordDto = {
      id: payload.id,
      title: payload.title.trim() || "Untitled Conversation",
      messages: payload.messages,
      draft: payload.draft,
      generatedQuestions: payload.generatedQuestions,
      generatedTarget: payload.generatedTarget,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    const nextList = [
      saved,
      ...existingList.filter((item) => item.id !== payload.id),
    ];
    writeLocalConversations(nextList);
    return saved;
  },

  async getTodos(): Promise<TodoRecordDto[]> {
    if (this.isAvailable()) {
      return (await window.ipcRenderer.invoke(
        "db:get-todos",
      )) as TodoRecordDto[];
    }
    return [...readLocalTodos()].sort((a, b) => {
      if (a.completed !== b.completed)
        return Number(a.completed) - Number(b.completed);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  },

  async createTodo(payload: CreateTodoInput): Promise<TodoRecordDto | null> {
    if (this.isAvailable()) {
      return (await window.ipcRenderer.invoke(
        "db:create-todo",
        payload,
      )) as TodoRecordDto | null;
    }
    const now = new Date().toISOString();
    const todos = readLocalTodos();
    const created: TodoRecordDto = {
      id: Date.now(),
      title: payload.title.trim() || `Challenge #${payload.challengeId ?? ""}`,
      notes: payload.notes?.trim() || null,
      importance: payload.importance ?? "medium",
      deadline: payload.deadline?.trim() || null,
      challengeId: payload.challengeId ?? null,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    writeLocalTodos([created, ...todos]);
    return created;
  },

  async toggleTodo(id: number): Promise<TodoRecordDto | null> {
    if (this.isAvailable()) {
      return (await window.ipcRenderer.invoke(
        "db:toggle-todo",
        id,
      )) as TodoRecordDto | null;
    }
    const now = new Date().toISOString();
    let updated: TodoRecordDto | null = null;
    const next = readLocalTodos().map((item) => {
      if (item.id !== id) return item;
      updated = { ...item, completed: !item.completed, updatedAt: now };
      return updated;
    });
    writeLocalTodos(next);
    return updated;
  },

  async toggleChallengeTodo(
    challengeId: number,
  ): Promise<{ queued: boolean; todo?: TodoRecordDto | null }> {
    if (this.isAvailable()) {
      return (await window.ipcRenderer.invoke(
        "db:toggle-challenge-todo",
        challengeId,
      )) as {
        queued: boolean;
        todo?: TodoRecordDto | null;
      };
    }
    const existing = readLocalTodos();
    if (existing.some((item) => item.challengeId === challengeId)) {
      writeLocalTodos(
        existing.filter((item) => item.challengeId !== challengeId),
      );
      return { queued: false };
    }
    const created = await this.createTodo({
      title: `Challenge #${challengeId}`,
      notes: null,
      importance: "high",
      deadline: null,
      challengeId,
    });
    return { queued: true, todo: created };
  },

  async deleteTodo(id: number): Promise<{ deleted: boolean }> {
    if (this.isAvailable()) {
      return (await window.ipcRenderer.invoke("db:delete-todo", id)) as {
        deleted: boolean;
      };
    }
    const existing = readLocalTodos();
    const next = existing.filter((item) => item.id !== id);
    writeLocalTodos(next);
    return { deleted: next.length < existing.length };
  },

  async clearCompletedTodos(): Promise<{ cleared: number }> {
    if (this.isAvailable()) {
      return (await window.ipcRenderer.invoke("db:clear-completed-todos")) as {
        cleared: number;
      };
    }
    const existing = readLocalTodos();
    const next = existing.filter((item) => !item.completed);
    writeLocalTodos(next);
    return { cleared: existing.length - next.length };
  },

  async getProfile(): Promise<UserProfileDto | null> {
    if (this.isAvailable()) {
      return (await window.ipcRenderer.invoke("db:get-profile")) as UserProfileDto | null;
    }
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as UserProfileDto) : null;
    } catch {
      return null;
    }
  },

  async saveProfile(payload: SaveUserProfileInput): Promise<UserProfileDto | null> {
    if (this.isAvailable()) {
      return (await window.ipcRenderer.invoke("db:save-profile", payload)) as UserProfileDto | null;
    }
    const existing = await this.getProfile();
    const now = new Date().toISOString();
    const displayName = payload.displayName.trim() || "Developer";
    const username =
      (payload.username ?? displayName)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "") || "developer";
    const saved: UserProfileDto = {
      id: 1,
      displayName,
      username,
      bio: (payload.bio ?? "").trim().slice(0, 240),
      avatarId: payload.avatarId || "cat",
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(saved));
      } catch {
        // Ignore storage quota errors in web preview
      }
    }
    return saved;
  },
};
