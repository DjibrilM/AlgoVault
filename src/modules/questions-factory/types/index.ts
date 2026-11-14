import type { AIPromptAttachment } from '@/components/ui/smoothui/ai-prompt-input'
import type { GeneratedQuestionItem, GenerationDraft } from '../utils/draftEngine'

/** Message rendered in the Questions Factory conversation feed. */
export interface StudioMessage {
  id: string
  from: 'assistant' | 'user'
  content: string
  attachments?: AIPromptAttachment[]
  reasoning?: string
}

/** Destination workspace entity produced by a generation run. */
export interface GeneratedTarget {
  name: string
  isMarathon: boolean
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
