export type DraftContentType =
  | 'Practice Questions'
  | 'Marathon Track'
  | 'Category & Challenges'

export type DraftDifficulty =
  | 'Easy'
  | 'Medium'
  | 'Hard'
  | 'Progressive (Easy → Hard)'

export type DraftQuestionStyle = 'Implementation' | 'Conceptual' | 'Mixed'

export interface GenerationDraft {
  category: string | null
  topic: string | null
  contentType: DraftContentType | null
  difficulty: DraftDifficulty | null
  questionCount: number | null
  questionStyle: DraftQuestionStyle | null
  readyToGenerate: boolean
  generated: boolean
}

export type DraftFieldKey =
  | 'category'
  | 'topic'
  | 'contentType'
  | 'difficulty'
  | 'questionCount'
  | 'questionStyle'

export interface GeneratedQuestionItem {
  id: string
  index: number
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  style: 'Conceptual' | 'Implementation'
  description: string
}

export interface GeneratedTargetDto {
  name: string
  isMarathon: boolean
}

export type AiProviderId =
  | 'gateway'
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'openai-compatible'

export interface SaveAiConfigDto {
  provider: AiProviderId
  modelId: string
  /** Omit to preserve any stored baseUrl for the provider. */
  baseUrl?: string
  /** Omit or leave undefined to preserve any stored key; pass clearApiKey to erase. */
  apiKey?: string
  clearApiKey?: boolean
}

export interface AiProviderStatusDto {
  configured: boolean
  source: 'settings' | 'env' | 'local' | 'none'
  provider: AiProviderId
  modelId: string
  baseUrl: string
  hasApiKey: boolean
  maskedApiKey: string | null
}

export interface AiModelOptionDto {
  id: string
  name: string
  provider: string
  description?: string
}

export interface AiConnectionTestResultDto {
  ok: boolean
  provider: AiProviderId
  modelId: string
  latencyMs: number
  reply?: string
  error?: string
}

export interface StudioMessageDto {
  id: string
  from: 'assistant' | 'user'
  content: string
  reasoning?: string
}

export interface StudioTurnRequestDto {
  runId: string
  prompt: string
  messages: StudioMessageDto[]
  draft: GenerationDraft | null
  forceGenerate?: boolean
  modelId?: string
}

export interface StudioTurnResultDto {
  runId: string
  text: string
  reasoning?: string
  draft: GenerationDraft | null
  updatedFields: DraftFieldKey[]
  generatedQuestions?: GeneratedQuestionItem[]
  generatedTarget?: GeneratedTargetDto | null
  generatedProblemIds?: number[]
  aborted?: boolean
}

export interface ChallengeContextDto {
  id: number
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  category: string
  description: string
  constraints: string[]
  examples: Array<{ input: string; output: string; explanation?: string }>
  hints?: string[]
  tags?: string[]
}

export interface SolutionFeedbackRequestDto {
  runId: string
  problem: ChallengeContextDto
  code: string
  lang: string
  submission: {
    status: 'success' | 'error'
    verdict?: string
    runtime?: string
    memory?: string
    passedCases?: number
    totalCases?: number
    failedCaseIndex?: number
    expected?: string
    actual?: string
    output?: string
    compileError?: string
  }
  modelId?: string
}

export interface SolutionFeedbackResultDto {
  runId: string
  text: string
  reasoning?: string
  cached?: boolean
  aborted?: boolean
}

export interface ChallengeChatRequestDto {
  runId: string
  problem: ChallengeContextDto
  prompt: string
  messages: StudioMessageDto[]
  currentCode?: string
  currentLang?: string
  modelId?: string
}

export interface ChallengeChatResultDto {
  runId: string
  text: string
  reasoning?: string
  aborted?: boolean
}

export type AiAgentRole =
  | 'master'
  | 'catalog-analyst'
  | 'challenge-architect'
  | 'starter-code-crafter'
  | 'challenge-verifier'
  | 'solution-coach'
  | 'challenge-explainer'

export type AiStreamEvent =
  | { runId: string; type: 'text-delta'; delta: string }
  | { runId: string; type: 'reasoning-delta'; delta: string }
  | {
      runId: string
      type: 'draft-updated'
      draft: GenerationDraft
      updatedFields: DraftFieldKey[]
    }
  | {
      runId: string
      type: 'agent-stage'
      agent: AiAgentRole
      label: string
      detail?: string
      toolName?: string
    }
  | { runId: string; type: 'error'; message: string }
  | { runId: string; type: 'done'; result: StudioTurnResultDto }

export const AI_CHANNELS = {
  GET_CONFIG: 'ai:get-config',
  SAVE_CONFIG: 'ai:save-config',
  LIST_MODELS: 'ai:list-models',
  TEST_CONNECTION: 'ai:test-connection',
  RUN_STUDIO_TURN: 'ai:run-studio-turn',
  RUN_SOLUTION_FEEDBACK: 'ai:run-solution-feedback',
  RUN_CHALLENGE_CHAT: 'ai:run-challenge-chat',
  ABORT_RUN: 'ai:abort-run',
  STREAM_EVENT: 'ai:stream-event',
} as const

export interface AiBridge {
  getConfig: () => Promise<AiProviderStatusDto>
  saveConfig: (dto: SaveAiConfigDto) => Promise<AiProviderStatusDto>
  listModels: (dto?: SaveAiConfigDto) => Promise<AiModelOptionDto[]>
  testConnection: (dto?: SaveAiConfigDto) => Promise<AiConnectionTestResultDto>
  runStudioTurn: (dto: StudioTurnRequestDto) => Promise<StudioTurnResultDto>
  runSolutionFeedback: (dto: SolutionFeedbackRequestDto) => Promise<SolutionFeedbackResultDto>
  runChallengeChat: (dto: ChallengeChatRequestDto) => Promise<ChallengeChatResultDto>
  abortRun: (runId: string) => Promise<{ aborted: boolean }>
  onStreamEvent: (listener: (event: AiStreamEvent) => void) => () => void
}

export const GEMINI_MODEL_PRESETS: AiModelOptionDto[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    description: 'Fast, balanced multimodal & coding model',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    description: 'Deep reasoning for complex algorithmic challenges',
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    provider: 'google',
    description: 'High-speed, lightweight model for quick iterations',
  },
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash Preview',
    provider: 'google',
    description: 'Next-generation fast reasoning & coding preview',
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro Preview',
    provider: 'google',
    description: 'Next-generation flagship reasoning preview',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    description: 'General-purpose fast generation',
  },
  {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash Lite',
    provider: 'google',
    description: 'Lightweight low-latency generation',
  },
]

export const AI_MODEL_PRESETS: Record<AiProviderId, AiModelOptionDto[]> = {
  gateway: GEMINI_MODEL_PRESETS,
  openai: GEMINI_MODEL_PRESETS,
  anthropic: GEMINI_MODEL_PRESETS,
  google: GEMINI_MODEL_PRESETS,
  'openai-compatible': GEMINI_MODEL_PRESETS,
}

export interface AiModelProviderGroup {
  provider: string
  label: string
  models: AiModelOptionDto[]
}

const PROVIDER_DISPLAY_LABELS: Record<string, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
  deepseek: 'DeepSeek',
  xai: 'xAI',
  meta: 'Meta',
  mistral: 'Mistral',
  cohere: 'Cohere',
  perplexity: 'Perplexity',
  amazon: 'Amazon',
  alibaba: 'Alibaba',
  moonshotai: 'Moonshot AI',
  zai: 'Z.ai',
  local: 'Local',
  gateway: 'Gateway',
}

const PRIORITY_PROVIDER_ORDER = [
  'anthropic',
  'openai',
  'google',
  'deepseek',
  'xai',
  'meta',
  'mistral',
  'cohere',
]

/** Extracts the normalized provider slug (`model.id.split('/')[0]` when scoped). */
export function getModelProviderKey(model: Pick<AiModelOptionDto, 'id' | 'provider'>): string {
  const slashIdx = model.id.indexOf('/')
  const raw = slashIdx > 0 ? model.id.slice(0, slashIdx) : model.provider
  return raw.trim().toLowerCase() || 'other'
}

/** Formats a provider key into a human-friendly display label. */
export function formatModelProviderLabel(provider: string): string {
  const key = provider.trim().toLowerCase()
  if (PROVIDER_DISPLAY_LABELS[key]) return PROVIDER_DISPLAY_LABELS[key]
  if (!key) return 'Other'
  return key
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/**
 * Groups models by provider prefix (`model.id.split('/')[0]` or `model.provider`),
 * putting flagship providers first and remaining providers alphabetically.
 */
export function groupModelsByProvider(models: AiModelOptionDto[]): AiModelProviderGroup[] {
  const buckets: Record<string, AiModelOptionDto[]> = {}
  for (const model of models) {
    const key = getModelProviderKey(model)
    if (!buckets[key]) {
      buckets[key] = []
    }
    buckets[key].push(model)
  }

  return Object.keys(buckets)
    .sort((a, b) => {
      const rankA = PRIORITY_PROVIDER_ORDER.indexOf(a)
      const rankB = PRIORITY_PROVIDER_ORDER.indexOf(b)
      if (rankA !== -1 && rankB !== -1) return rankA - rankB
      if (rankA !== -1) return -1
      if (rankB !== -1) return 1
      return a.localeCompare(b)
    })
    .map((provider) => ({
      provider,
      label: formatModelProviderLabel(provider),
      models: buckets[provider],
    }))
}

export const AI_PROVIDER_ORDER: AiProviderId[] = ['google']

export const AI_PROVIDER_DEFAULTS: Record<
  AiProviderId,
  { label: string; modelId: string; baseUrl: string; placeholderKey: string; description: string }
> = {
  gateway: {
    label: 'Vercel AI Gateway',
    modelId: 'anthropic/claude-sonnet-4.5',
    baseUrl: '',
    placeholderKey: 'AI_GATEWAY_API_KEY',
    description: 'Single key routing across Anthropic, OpenAI, Google, and more via AI Gateway.',
  },
  openai: {
    label: 'OpenAI',
    modelId: 'gpt-4.1-mini',
    baseUrl: '',
    placeholderKey: 'sk-...',
    description: 'Direct OpenAI API using OPENAI_API_KEY.',
  },
  anthropic: {
    label: 'Anthropic',
    modelId: 'claude-sonnet-4-5',
    baseUrl: '',
    placeholderKey: 'sk-ant-...',
    description: 'Direct Anthropic Messages API using ANTHROPIC_API_KEY.',
  },
  google: {
    label: 'Google Gemini',
    modelId: 'gemini-2.5-flash',
    baseUrl: '',
    placeholderKey: 'AIza... (or GOOGLE_GENERATIVE_AI_API_KEY)',
    description: 'Direct Google AI Studio Gemini API via @ai-sdk/google (GOOGLE_GENERATIVE_AI_API_KEY).',
  },
  'openai-compatible': {
    label: 'Local / OpenAI-Compatible (LM Studio, Ollama)',
    modelId: 'local-model',
    baseUrl: 'http://127.0.0.1:1234/v1',
    placeholderKey: 'Optional API key',
    description: 'Local offline inference via LM Studio, Ollama (/v1), vLLM, or any OpenAI-compatible server.',
  },
}
