/**
 * @file index.ts
 * @description Channel routing constants, options, and layer interfaces for code-test.
 */

import type { DataSource } from 'typeorm'
import type { IpcMain } from 'electron'
import type { SandboxVmOptions } from '../../engine-runner/sandboxVm.ts'
import type { ITypeCheckerService } from '../services/type-checker.service.ts'
import type {
  RunCodeDto,
  CodeTestResultDto,
  VmStatusDto,
  EvaluateCodeDto,
  EvaluationResultDto,
} from '../dto/index.ts'

export * from '../dto/index.ts'

/**
 * IPC route channels matching the NestJS microservice message pattern style.
 */
export const CODE_TEST_CHANNELS = {
  /** Unified evaluate endpoint: receives challengeId + code, returns pass/fail and telemetry */
  EVALUATE: 'code-test:evaluate',
  /** Low-level run endpoint: executes arbitrary raw test cases */
  RUN: 'code-test:run',
  /** Explicitly start / warm-up the sandbox virtual machine */
  START_VM: 'code-test:start-vm',
  /** Gracefully power off the sandbox virtual machine */
  STOP_VM: 'code-test:stop-vm',
  /** Query current health and runtime status of the sandbox virtual machine */
  GET_STATUS: 'code-test:get-status',
  /** Load categories, challenges, and submissions from SQLite database */
  GET_WORKSPACE_DATA: 'db:get-workspace-data',
  /** Persist user challenge progress (solution, solved, starred) */
  SAVE_CHALLENGE_PROGRESS: 'db:save-challenge-progress',
  /** Create a new category (and optional 1:1 challenge) in SQLite */
  CREATE_CATEGORY: 'db:create-category',
  /** List submissions from SQLite */
  GET_SUBMISSIONS: 'db:get-submissions',
  /** List favorited challenges from SQLite */
  GET_FAVORITES: 'db:get-favorites',
  /** Toggle favorite status for a challenge */
  TOGGLE_FAVORITE: 'db:toggle-favorite',
  /** List paginated Questions Factory conversations from SQLite */
  GET_FACTORY_CONVERSATIONS: 'db:get-factory-conversations',
  /** Save or update a Questions Factory conversation snapshot in SQLite */
  SAVE_FACTORY_CONVERSATION: 'db:save-factory-conversation',
} as const

export type CodeTestChannel = (typeof CODE_TEST_CHANNELS)[keyof typeof CODE_TEST_CHANNELS]

/**
 * Configuration options for the CodeTestService provider.
 */
export interface CodeTestServiceOptions extends Partial<SandboxVmOptions> {
  /**
   * Whether to automatically boot the virtual machine when the service is instantiated.
   * Defaults to false (lazy boot on first test run).
   */
  autoStart?: boolean
  /**
   * Optional custom TypeScript type-checker service for static analysis.
   */
  typeChecker?: ITypeCheckerService
}

export interface CreateChallengePayload {
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

export interface SaveFactoryConversationDto {
  id: string
  title: string
  messages: Array<Record<string, unknown>>
  draft: Record<string, unknown> | null
  generatedQuestions: Array<Record<string, unknown>>
  generatedTarget: Record<string, unknown> | null
}

export interface PaginatedFactoryConversationsDto {
  items: unknown[]
  page: number
  limit: number
  total: number
  hasMore: boolean
}

/**
 * Service contract for the code-test provider.
 */
export interface ICodeTestService {
  /** Evaluates code for a specific challenge ID and returns comprehensive pass/fail results */
  evaluate(dto: EvaluateCodeDto): Promise<EvaluationResultDto>

  /** Low-level execution for arbitrary code and test cases */
  runCode(dto: RunCodeDto): Promise<CodeTestResultDto>

  /** Boots the micro-VM */
  startVm(): Promise<VmStatusDto>

  /** Stops the micro-VM */
  stopVm(): Promise<void>

  /** Queries VM status */
  getStatus(): VmStatusDto

  /** Attaches initialized TypeORM DataSource for persistence */
  setDataSource(dataSource: DataSource): void

  /** Loads all categories, challenges, and submissions from SQLite */
  getWorkspaceData(): Promise<{
    categories: unknown[]
    challenges: unknown[]
    submissions: unknown[]
  }>

  /** Persists challenge progress (solution, solved, starred) */
  saveChallengeProgress(dto: {
    challengeId: number
    solution?: string
    solved?: boolean
    starred?: boolean
  }): Promise<unknown>

  /** Finds an existing category by title (case-insensitive) or creates one, then attaches challenge(s) */
  createCategory(dto: {
    title: string
    description: string
    challenge?: CreateChallengePayload
    challenges?: CreateChallengePayload[]
  }): Promise<{ category: unknown; created?: boolean; challenge?: unknown; challenges?: unknown[] }>

  /** Lists recorded submissions */
  getSubmissions(challengeId?: number): Promise<unknown[]>

  /** Lists favorited challenges */
  getFavorites(): Promise<unknown[]>

  /** Toggles favorite status for a challenge */
  toggleFavorite(challengeId: number): Promise<{ favorited: boolean }>

  /** Lists paginated Questions Factory conversation history (newest first) */
  getFactoryConversations(dto?: {
    page?: number
    limit?: number
  }): Promise<PaginatedFactoryConversationsDto>

  /** Saves or updates a Questions Factory conversation snapshot */
  saveFactoryConversation(dto: SaveFactoryConversationDto): Promise<unknown>
}

/**
 * Controller contract for handling IPC message patterns.
 */
export interface ICodeTestController {
  registerIpc(ipc?: IpcMain): void
  unregisterIpc(ipc?: IpcMain): void
  evaluate(dto: EvaluateCodeDto): Promise<EvaluationResultDto>
  run(dto: RunCodeDto): Promise<CodeTestResultDto>
  startVm(): Promise<VmStatusDto>
  stopVm(): Promise<{ success: boolean }>
  getStatus(): VmStatusDto
}

/**
 * Configuration options for CodeTestModule.forRoot().
 */
export interface CodeTestModuleOptions extends CodeTestServiceOptions {
  /** Optional custom ipcMain instance (useful for testing) */
  ipcMain?: IpcMain
}
