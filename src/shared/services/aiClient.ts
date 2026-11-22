import {
  AI_MODEL_PRESETS,
  type AiConnectionTestResultDto,
  type AiModelOptionDto,
  type AiProviderStatusDto,
  type AiStreamEvent,
  type ChallengeChatRequestDto,
  type ChallengeChatResultDto,
  type SaveAiConfigDto,
  type SolutionFeedbackRequestDto,
  type SolutionFeedbackResultDto,
  type StudioTurnRequestDto,
  type StudioTurnResultDto,
} from '@/shared/types/ai'

const DEFAULT_UNAVAILABLE_STATUS: AiProviderStatusDto = {
  configured: false,
  source: 'none',
  provider: 'google',
  modelId: 'gemini-2.5-flash',
  baseUrl: '',
  hasApiKey: false,
  maskedApiKey: null,
}

export const aiClient = {
  isAvailable(): boolean {
    return typeof window !== 'undefined' && Boolean(window.aiClient)
  },

  async getConfig(): Promise<AiProviderStatusDto> {
    if (!this.isAvailable()) return DEFAULT_UNAVAILABLE_STATUS
    return window.aiClient!.getConfig()
  },

  async saveConfig(dto: SaveAiConfigDto): Promise<AiProviderStatusDto> {
    if (!this.isAvailable()) {
      throw new Error('AI configuration requires the desktop app environment.')
    }
    return window.aiClient!.saveConfig(dto)
  },

  async listModels(dto?: SaveAiConfigDto): Promise<AiModelOptionDto[]> {
    if (!this.isAvailable()) {
      return AI_MODEL_PRESETS[dto?.provider ?? 'google']
    }
    return window.aiClient!.listModels(dto)
  },

  async testConnection(dto?: SaveAiConfigDto): Promise<AiConnectionTestResultDto> {
    if (!this.isAvailable()) {
      return {
        ok: false,
        provider: dto?.provider ?? 'google',
        modelId: dto?.modelId ?? '',
        latencyMs: 0,
        error: 'Desktop runtime is unavailable in browser preview.',
      }
    }
    return window.aiClient!.testConnection(dto)
  },

  async runStudioTurn(dto: StudioTurnRequestDto): Promise<StudioTurnResultDto> {
    if (!this.isAvailable()) {
      throw new Error('Desktop AI engine is unavailable in browser preview.')
    }
    return window.aiClient!.runStudioTurn(dto)
  },

  async runSolutionFeedback(dto: SolutionFeedbackRequestDto): Promise<SolutionFeedbackResultDto> {
    if (!this.isAvailable()) {
      throw new Error('Desktop AI engine is unavailable in browser preview.')
    }
    return window.aiClient!.runSolutionFeedback(dto)
  },

  async runChallengeChat(dto: ChallengeChatRequestDto): Promise<ChallengeChatResultDto> {
    if (!this.isAvailable()) {
      throw new Error('Desktop AI engine is unavailable in browser preview.')
    }
    return window.aiClient!.runChallengeChat(dto)
  },

  async abortRun(runId: string): Promise<{ aborted: boolean }> {
    if (!this.isAvailable()) return { aborted: false }
    return window.aiClient!.abortRun(runId)
  },

  onStreamEvent(listener: (event: AiStreamEvent) => void): () => void {
    if (!this.isAvailable()) return () => {}
    return window.aiClient!.onStreamEvent(listener)
  },
}
