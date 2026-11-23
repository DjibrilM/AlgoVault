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
  ChallengeChatRequestDto,
  ChallengeChatResultDto,
  DraftFieldKey,
  GenerationDraft,
  SaveAiConfigDto,
  SolutionFeedbackRequestDto,
  SolutionFeedbackResultDto,
  StudioTurnRequestDto,
  StudioTurnResultDto,
} from '../../../../src/shared/types/ai.ts'
import type { OnModuleDestroy } from '../../code-test/common/lifecycle.ts'
import type { CodeTestService } from '../../code-test/services/code-test.service.ts'
import {
  buildChallengeChatMessages,
  createChallengeExplainerAgent,
} from '../agents/challenge-explainer.subagent.ts'
import { createMasterAgent } from '../agents/master.agent.ts'
import {
  buildSolutionFeedbackPrompt,
  createSolutionFeedbackAgent,
} from '../agents/solution-feedback.subagent.ts'
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

function buildNaturalDraftReply(
  draft: GenerationDraft,
  updatedFields: DraftFieldKey[],
  savedTarget: { name: string } | null,
  builtCount: number
): string {
  if (savedTarget) {
    return `Done! Created **${savedTarget.name}** with **${builtCount}** ${
      builtCount === 1 ? 'challenge' : 'challenges'
    }. Click **Open Workspace** on the right whenever you're ready to start.`
  }

  const parts: string[] = []
  if (updatedFields.includes('topic') && draft.topic) {
    parts.push(`topic to **${draft.topic}**`)
  }
  if (updatedFields.includes('questionCount') && draft.questionCount) {
    parts.push(`**${draft.questionCount} ${draft.questionCount === 1 ? 'question' : 'questions'}**`)
  }
  if (updatedFields.includes('difficulty') && draft.difficulty) {
    parts.push(`**${draft.difficulty}** difficulty`)
  }
  if (updatedFields.includes('questionStyle') && draft.questionStyle) {
    parts.push(`**${draft.questionStyle}** style`)
  }
  if (updatedFields.includes('contentType') && draft.contentType) {
    parts.push(`**${draft.contentType}** format`)
  }

  const ack =
    parts.length > 0
      ? `Got it — updated ${parts.join(', ')}.`
      : 'Got it, I’ve noted that.'

  const missing: string[] = []
  if (!draft.topic) missing.push('topic')
  if (!draft.questionCount) missing.push('how many questions you want')
  if (!draft.difficulty) missing.push('difficulty level')
  if (!draft.questionStyle) missing.push('question style')

  if (missing.length > 0) {
    return `${ack} What ${missing.slice(0, 2).join(' and ')} would you like?`
  }

  return `${ack} Everything looks set for **${draft.topic}** (${draft.questionCount} ${draft.difficulty} ${draft.questionStyle} questions) — would you like me to generate them now?`
}

export class AiService implements IAiService, OnModuleDestroy {
  private readonly modelFactory = new ModelFactoryService()
  private readonly customModelResolver?: ModelResolverFn
  private readonly defaultStreamListener?: (event: AiStreamEvent) => void
  private readonly activeControllers = new Map<string, AbortController>()
  private readonly feedbackCache = new Map<string, { text: string; reasoning?: string }>()
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
    let resolvedProvider = dto?.provider ?? 'google'
    let resolvedModel = dto?.modelId ?? ''

    try {
      const resolved = this.customModelResolver
        ? await this.customModelResolver(dto)
        : await this.modelFactory.resolveLanguageModel(dto)

      resolvedProvider = resolved.status.provider
      resolvedModel = resolved.status.modelId

      if (!this.customModelResolver && resolvedProvider === 'google') {
        const effective = await this.modelFactory.getEffectiveConfig(dto)
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?pageSize=1&key=${encodeURIComponent(
            effective.apiKey
          )}`,
          { signal: AbortSignal.timeout(5000) }
        )
        if (!res.ok) {
          let errMsg = `Google Gemini API returned HTTP ${res.status}`
          try {
            const body = (await res.json()) as { error?: { message?: string } }
            if (body?.error?.message) errMsg = body.error.message
          } catch {
            // Ignore non-JSON error body
          }
          throw new Error(errMsg)
        }
        return {
          ok: true,
          provider: resolvedProvider,
          modelId: resolvedModel,
          latencyMs: Date.now() - start,
          reply: 'OK',
        }
      }

      const result = await generateText({
        model: resolved.model,
        prompt: 'Reply with exactly: OK',
        maxOutputTokens: 16,
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(8000),
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

  private async resolveModel(modelId?: string) {
    return this.customModelResolver
      ? this.customModelResolver(undefined, modelId)
      : this.modelFactory.resolveLanguageModel(undefined, modelId)
  }

  private async consumeAgentStream(
    runId: string,
    streamResult: {
      fullStream: AsyncIterable<{ type: string; text?: string; error?: unknown }>
      text: PromiseLike<string>
      reasoningText?: PromiseLike<string | undefined>
    },
    emitEvent: (event: AiStreamEvent) => void
  ): Promise<{ text: string; reasoning?: string }> {
    let text = ''
    let reasoning = ''

    for await (const part of streamResult.fullStream) {
      if (part.type === 'text-delta' && part.text) {
        text += part.text
        emitEvent({ runId, type: 'text-delta', delta: part.text })
      } else if (part.type === 'reasoning-delta' && part.text) {
        reasoning += part.text
        emitEvent({ runId, type: 'reasoning-delta', delta: part.text })
      } else if (part.type === 'error' || part.type === 'tool-error') {
        const message =
          part.error instanceof Error ? part.error.message : String(part.error ?? 'Unknown agent error')
        throw new Error(message)
      }
    }

    const finalText = text.trim() || (await streamResult.text).trim()
    const finalReasoning =
      reasoning.trim() || (await streamResult.reasoningText)?.trim() || undefined

    return { text: finalText, reasoning: finalReasoning }
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
      const resolved = await this.resolveModel(dto.modelId)

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

      const { text: finalText, reasoning: finalReasoning } = await this.consumeAgentStream(
        dto.runId,
        streamResult,
        emitEvent
      )

      const builtItems = state.getBuiltItems()
      const savedTarget = state.getSavedTarget()
      const challengeIds = state.getChallengeIds()
      const finalDraft = state.getDraft()

      const updatedFields = state.getUpdatedFields()

      const result: StudioTurnResultDto = {
        runId: dto.runId,
        text:
          finalText ||
          buildNaturalDraftReply(
            finalDraft,
            updatedFields,
            savedTarget,
            builtItems?.length ?? 0
          ),
        ...(finalReasoning ? { reasoning: finalReasoning } : {}),
        draft: finalDraft,
        updatedFields,
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

  async runSolutionFeedback(
    dto: SolutionFeedbackRequestDto,
    onEvent?: (event: AiStreamEvent) => void
  ): Promise<SolutionFeedbackResultDto> {
    const emitEvent = (event: AiStreamEvent) => {
      this.defaultStreamListener?.(event)
      onEvent?.(event)
    }

    const cacheKey = `${dto.problem.id}:${dto.lang}:${dto.code.trim()}`
    const cached = this.feedbackCache.get(cacheKey)
    if (cached) {
      return {
        runId: dto.runId,
        text: cached.text,
        ...(cached.reasoning ? { reasoning: cached.reasoning } : {}),
        cached: true,
      }
    }

    const abortController = new AbortController()
    this.activeControllers.set(dto.runId, abortController)

    try {
      const resolved = await this.resolveModel(dto.modelId)
      emitEvent({
        runId: dto.runId,
        type: 'agent-stage',
        agent: 'solution-coach',
        label: 'Analyzing solution complexity...',
        detail: `Reviewing ${dto.lang} submission for ${dto.problem.title}`,
      })

      const coach = createSolutionFeedbackAgent(resolved.model)
      const streamResult = await coach.stream({
        prompt: buildSolutionFeedbackPrompt(dto),
        abortSignal: abortController.signal,
      })

      const { text: finalText, reasoning: finalReasoning } = await this.consumeAgentStream(
        dto.runId,
        streamResult,
        emitEvent
      )

      if (finalText) {
        this.feedbackCache.set(cacheKey, {
          text: finalText,
          ...(finalReasoning ? { reasoning: finalReasoning } : {}),
        })
      }

      return {
        runId: dto.runId,
        text: finalText,
        ...(finalReasoning ? { reasoning: finalReasoning } : {}),
        cached: false,
      }
    } catch (err) {
      if (abortController.signal.aborted || isAbortError(err)) {
        return {
          runId: dto.runId,
          text: '',
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

  async runChallengeChat(
    dto: ChallengeChatRequestDto,
    onEvent?: (event: AiStreamEvent) => void
  ): Promise<ChallengeChatResultDto> {
    const emitEvent = (event: AiStreamEvent) => {
      this.defaultStreamListener?.(event)
      onEvent?.(event)
    }

    const abortController = new AbortController()
    this.activeControllers.set(dto.runId, abortController)

    try {
      const resolved = await this.resolveModel(dto.modelId)
      emitEvent({
        runId: dto.runId,
        type: 'agent-stage',
        agent: 'challenge-explainer',
        label: 'Explaining challenge...',
        detail: `Reviewing ${dto.problem.title}`,
      })

      const explainer = createChallengeExplainerAgent(
        resolved.model,
        dto.problem,
        dto.currentLang,
        dto.currentCode
      )
      const streamResult = await explainer.stream({
        messages: buildChallengeChatMessages(dto),
        abortSignal: abortController.signal,
      })

      const { text: finalText, reasoning: finalReasoning } = await this.consumeAgentStream(
        dto.runId,
        streamResult,
        emitEvent
      )

      return {
        runId: dto.runId,
        text: finalText,
        ...(finalReasoning ? { reasoning: finalReasoning } : {}),
      }
    } catch (err) {
      if (abortController.signal.aborted || isAbortError(err)) {
        return {
          runId: dto.runId,
          text: '',
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
