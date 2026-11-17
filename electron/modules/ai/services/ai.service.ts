/**
 * @file services/ai.service.ts
 * @description NestJS-style Injectable Service orchestrating the Questions Factory Master Agent,
 * provider resolution, connection testing, streaming progress, and run cancellation.
 */

import { generateText, type ModelMessage } from 'ai'
import type { DataSource } from 'typeorm'
import type {
  AiConnectionTestResultDto,
  AiModelOptionDto,
  AiProviderStatusDto,
  AiStreamEvent,
  SaveAiConfigDto,
  StudioTurnRequestDto,
  StudioTurnResultDto,
} from '../../../../src/shared/types/ai.ts'
import type { OnModuleDestroy } from '../../code-test/common/lifecycle.ts'
import type { CodeTestService } from '../../code-test/services/code-test.service.ts'
import { createMasterAgent } from '../agents/master.agent.ts'
import type { AiModuleOptions, IAiService, ModelResolverFn } from '../types/index.ts'
import { ModelFactoryService } from './model-factory.service.ts'

function isAbortError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.name === 'AbortError' || /abort/i.test(err.message))
  )
}

function buildConversationMessages(dto: StudioTurnRequestDto): ModelMessage[] {
  const history: ModelMessage[] = dto.messages
    .filter((msg) => msg.id !== 'welcome' && msg.content.trim().length > 0)
    .slice(-16)
    .map((msg) => ({
      role: msg.from,
      content: msg.content,
    }))

  const draftContextLine = dto.draft
    ? `\n\n[Current Draft State: ${JSON.stringify(dto.draft)}]`
    : ''
  const forceLine = dto.forceGenerate
    ? '\n[Instruction: User confirmed generation. Consult the catalog analyst, invoke the challenge architect, verify the challenges, and save them now.]'
    : ''

  const userContent = `${dto.prompt.trim()}${draftContextLine}${forceLine}`
  const last = history[history.length - 1]
  if (last && last.role === 'user' && last.content === dto.prompt.trim()) {
    history[history.length - 1] = { role: 'user', content: userContent }
  } else {
    history.push({ role: 'user', content: userContent })
  }

  return history
}

export class AiService implements IAiService, OnModuleDestroy {
  private readonly modelFactory = new ModelFactoryService()
  private readonly customModelResolver?: ModelResolverFn
  private readonly defaultStreamListener?: (event: AiStreamEvent) => void
  private readonly activeControllers = new Map<string, AbortController>()
  private codeTestService: CodeTestService | null = null

  constructor(options: AiModuleOptions = {}) {
    if (options.dataSource) {
      this.modelFactory.setDataSource(options.dataSource)
    }
    this.codeTestService = options.codeTestService ?? null
    this.customModelResolver = options.modelResolver
    this.defaultStreamListener = options.onStreamEvent
  }

  setDataSource(dataSource: DataSource): void {
    this.modelFactory.setDataSource(dataSource)
  }

  setCodeTestService(service: CodeTestService): void {
    this.codeTestService = service
  }

  async onModuleDestroy(): Promise<void> {
    for (const controller of this.activeControllers.values()) {
      controller.abort()
    }
    this.activeControllers.clear()
  }

  async getConfig(): Promise<AiProviderStatusDto> {
    if (this.customModelResolver) {
      try {
        const resolved = await this.customModelResolver()
        return resolved.status
      } catch {
        // Fall back to DB/env status
      }
    }
    return this.modelFactory.getStatus()
  }

  async saveConfig(dto: SaveAiConfigDto): Promise<AiProviderStatusDto> {
    return this.modelFactory.saveConfig(dto)
  }

  async listModels(dto?: SaveAiConfigDto): Promise<AiModelOptionDto[]> {
    return this.modelFactory.listAvailableModels(dto)
  }

  async testConnection(dto?: SaveAiConfigDto): Promise<AiConnectionTestResultDto> {
    const start = Date.now()
    let resolvedProvider = dto?.provider ?? 'gateway'
    let resolvedModel = dto?.modelId ?? ''

    try {
      const resolved = this.customModelResolver
        ? await this.customModelResolver(dto)
        : await this.modelFactory.resolveLanguageModel(dto)

      resolvedProvider = resolved.status.provider
      resolvedModel = resolved.status.modelId

      const result = await generateText({
        model: resolved.model,
        prompt: 'Reply with exactly: OK',
        maxOutputTokens: 16,
      })

      return {
        ok: true,
        provider: resolvedProvider,
        modelId: resolvedModel,
        latencyMs: Date.now() - start,
        reply: result.text.trim(),
      }
    } catch (err) {
      return {
        ok: false,
        provider: resolvedProvider,
        modelId: resolvedModel,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  abortRun(runId: string): { aborted: boolean } {
    const controller = this.activeControllers.get(runId)
    if (!controller) return { aborted: false }
    controller.abort()
    this.activeControllers.delete(runId)
    return { aborted: true }
  }

  async runStudioTurn(
    dto: StudioTurnRequestDto,
    onEvent?: (event: AiStreamEvent) => void
  ): Promise<StudioTurnResultDto> {
    const emitEvent = (event: AiStreamEvent) => {
      this.defaultStreamListener?.(event)
      onEvent?.(event)
    }

    const abortController = new AbortController()
    this.activeControllers.set(dto.runId, abortController)

    try {
      const resolved = this.customModelResolver
        ? await this.customModelResolver(undefined, dto.modelId)
        : await this.modelFactory.resolveLanguageModel(undefined, dto.modelId)

      const { agent, state } = createMasterAgent({
        runId: dto.runId,
        model: resolved.model,
        codeTestService: this.codeTestService,
        initialDraft: dto.draft,
        forceGenerate: Boolean(dto.forceGenerate),
        emitEvent,
      })

      const streamResult = await agent.stream({
        messages: buildConversationMessages(dto),
        abortSignal: abortController.signal,
      })

      let text = ''
      let reasoning = ''

      for await (const part of streamResult.fullStream) {
        if (part.type === 'text-delta' && part.text) {
          text += part.text
          emitEvent({ runId: dto.runId, type: 'text-delta', delta: part.text })
        } else if (part.type === 'reasoning-delta' && part.text) {
          reasoning += part.text
          emitEvent({ runId: dto.runId, type: 'reasoning-delta', delta: part.text })
        } else if (part.type === 'error') {
          const message =
            part.error instanceof Error ? part.error.message : String(part.error)
          throw new Error(message)
        }
      }

      const finalText = text.trim() || (await streamResult.text).trim()
      const finalReasoning = reasoning.trim() || (await streamResult.reasoningText)?.trim() || undefined

      const builtItems = state.getBuiltItems()
      const savedTarget = state.getSavedTarget()
      const challengeIds = state.getChallengeIds()
      const finalDraft = state.getDraft()

      const result: StudioTurnResultDto = {
        runId: dto.runId,
        text:
          finalText ||
          (savedTarget
            ? `Created **${savedTarget.name}** with **${builtItems?.length ?? 0}** challenges.`
            : 'Updated your generation draft.'),
        ...(finalReasoning ? { reasoning: finalReasoning } : {}),
        draft: finalDraft,
        updatedFields: state.getUpdatedFields(),
        ...(builtItems ? { generatedQuestions: builtItems } : {}),
        ...(savedTarget ? { generatedTarget: savedTarget } : {}),
        ...(challengeIds.length > 0 ? { generatedProblemIds: challengeIds } : {}),
      }

      emitEvent({ runId: dto.runId, type: 'done', result })
      return result
    } catch (err) {
      if (abortController.signal.aborted || isAbortError(err)) {
        return {
          runId: dto.runId,
          text: '',
          draft: dto.draft,
          updatedFields: [],
          aborted: true,
        }
      }
      const message = err instanceof Error ? err.message : String(err)
      emitEvent({ runId: dto.runId, type: 'error', message })
      throw err
    } finally {
      this.activeControllers.delete(dto.runId)
    }
  }
}
