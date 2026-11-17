import type { AIPromptAttachment } from '@/components/ui/smoothui/ai-prompt-input'
import type { GeneratedQuestionItem, GenerationDraft } from '../utils/draftEngine'

/** Message rendered in the Questions Factory conversation feed. */
export interface StudioMessage {
  id: string
  from: 'assistant' | 'user'
  content: string
  attachments?: AIPromptAttachment[]
  reasoning?: string
  isStreaming?: boolean
}

/** Destination workspace entity produced by a generation run. */
export interface GeneratedTarget {
  name: string
  isMarathon: boolean
}

/** Visual choreography phase for the center-stage generation orb overlay. */
export type GenerationOverlayPhase = 'idle' | 'preparing' | 'returning'

/** Active step metadata displayed beneath the centered orb during generation. */
export interface GenerationProcessStatus {
  stepIndex: number
  totalSteps: number
  label: string
  detail?: string
}

/** Hydrated Questions Factory conversation snapshot stored in history. */
export interface FactoryConversationSnapshot {
  id: string
  title: string
  messages: StudioMessage[]
  draft: GenerationDraft | null
  generatedQuestions: GeneratedQuestionItem[]
  generatedTarget: GeneratedTarget | null
  createdAt: string
  updatedAt: string
}
