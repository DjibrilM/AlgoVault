import type { LanguageModel } from 'ai'
import type { IpcMain } from 'electron'
import type { DataSource } from 'typeorm'
import { z } from 'zod'
import type {
  AiConnectionTestResultDto,
  AiModelOptionDto,
  AiProviderStatusDto,
  AiStreamEvent,
  DraftFieldKey,
  GeneratedQuestionItem,
  GeneratedTargetDto,
  GenerationDraft,
  SaveAiConfigDto,
  StudioTurnRequestDto,
  StudioTurnResultDto,
} from '../../../../src/shared/types/ai.ts'
import type { CodeTestService } from '../../code-test/services/code-test.service.ts'

export const ArchitectedExampleSchema = z.object({
  input: z.string().min(1).describe('Formatted example input, e.g. "nums = [2, 7, 11], target = 9"'),
  output: z.string().min(1).describe('Expected serialized output, e.g. "[0, 1]"'),
  explanation: z.string().optional().describe('Concise reasoning walkthrough for the example'),
})

export const ArchitectedTestCaseSchema = z.object({
  input: z.string().min(1).describe('Harness-compatible input assignment'),
  expected: z.string().min(1).describe('Expected serialized return output'),
  hidden: z.boolean().optional().describe('Mark tricky edge cases true for submission-only judging'),
})

export const ArchitectedChallengeSchema = z.object({
  title: z.string().min(3),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  style: z.enum(['Implementation', 'Conceptual']),
  description: z.string().min(15).describe('Clear problem statement in Markdown (KaTeX math supported)'),
  constraints: z.array(z.string().min(1)).min(1),
  hints: z.array(z.string().min(1)).min(1),
  examples: z.array(ArchitectedExampleSchema).min(1),
  initialSolutions: z.object({
    typescript: z.string().min(5).describe('Pure function signature with TypeScript types, no stdin/stdout'),
    javascript: z.string().min(5).describe('Pure function signature in JavaScript, no stdin/stdout'),
    python: z.string().min(5).describe('Pure def function signature with type hints, no stdin/stdout'),
    cpp: z.string().min(5).describe('Pure C++ function or Solution method signature, no main()'),
  }),
  testCases: z.array(ArchitectedTestCaseSchema).min(2),
})

export const ArchitectedChallengeSetSchema = z.object({
  categoryTitle: z.string().min(2),
  categoryDescription: z.string().min(5),
  challenges: z.array(ArchitectedChallengeSchema).min(1).max(15),
})

export type ArchitectedChallenge = z.infer<typeof ArchitectedChallengeSchema>
export type ArchitectedChallengeSet = z.infer<typeof ArchitectedChallengeSetSchema>

export interface VerificationReport {
  valid: boolean
  checkedCount: number
  issues: string[]
  warnings: string[]
}

export interface AgentRuntimeContext {
  runId: string
  forceGenerate: boolean
  phase: 'shaping' | 'researching' | 'architecting' | 'verifying' | 'persisting' | 'completed'
  draft: GenerationDraft
  hasBuiltSet: boolean
  isVerified: boolean
  savedTarget: GeneratedTargetDto | null
}

export interface StudioRunHooks {
  emitEvent: (event: AiStreamEvent) => void
  abortSignal?: AbortSignal
}

export interface MasterAgentToolsContext {
  codeTestService: CodeTestService | null
  emitEvent: (event: AiStreamEvent) => void
  onDraftUpdated: (draft: GenerationDraft, updatedFields: DraftFieldKey[]) => void
  onChallengeSetBuilt: (set: ArchitectedChallengeSet, items: GeneratedQuestionItem[]) => void
  onChallengeSetSaved: (target: GeneratedTargetDto) => void
  getCurrentDraft: () => GenerationDraft
  getBuiltChallengeSet: () => ArchitectedChallengeSet | null
  getBuiltQuestionItems: () => GeneratedQuestionItem[]
}

export type ModelResolverFn = (override?: SaveAiConfigDto, modelIdOverride?: string) => Promise<{
  model: LanguageModel
  status: AiProviderStatusDto
}>

export interface AiModuleOptions {
  ipcMain?: IpcMain
  dataSource?: DataSource | null
  codeTestService?: CodeTestService | null
  modelResolver?: ModelResolverFn
  onStreamEvent?: (event: AiStreamEvent) => void
}

export interface IAiService {
  setDataSource(dataSource: DataSource): void
  setCodeTestService(service: CodeTestService): void
  getConfig(): Promise<AiProviderStatusDto>
  saveConfig(dto: SaveAiConfigDto): Promise<AiProviderStatusDto>
  listModels(dto?: SaveAiConfigDto): Promise<AiModelOptionDto[]>
  testConnection(dto?: SaveAiConfigDto): Promise<AiConnectionTestResultDto>
  runStudioTurn(
    dto: StudioTurnRequestDto,
    onEvent?: (event: AiStreamEvent) => void
  ): Promise<StudioTurnResultDto>
  abortRun(runId: string): { aborted: boolean }
}

export interface IAiController {
  registerIpc(ipc?: IpcMain): void
  unregisterIpc(ipc?: IpcMain): void
  getConfig(): Promise<AiProviderStatusDto>
  saveConfig(dto: SaveAiConfigDto): Promise<AiProviderStatusDto>
  listModels(dto?: SaveAiConfigDto): Promise<AiModelOptionDto[]>
  testConnection(dto?: SaveAiConfigDto): Promise<AiConnectionTestResultDto>
  runStudioTurn(dto: StudioTurnRequestDto): Promise<StudioTurnResultDto>
  abortRun(runId: string): { aborted: boolean }
}
