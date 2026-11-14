import { CopyIcon, Paperclip, ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
  MessageToolbar,
} from '@/components/ai-elements/message'
import AIReasoning from '@/components/ui/smoothui/ai-reasoning'
import type { AIPromptAttachment } from '@/components/ui/smoothui/ai-prompt-input'
import type { StudioMessage } from '../types'

interface FactoryConversationProps {
  messages: StudioMessage[]
  liked: Record<string, boolean>
  disliked: Record<string, boolean>
  onToggleLike: (id: string) => void
  onToggleDislike: (id: string) => void
  onCopy: (content: string) => void
}

function MessageAttachments({ attachments }: { attachments: AIPromptAttachment[] }) {
  return (
    <div className="mb-1.5 flex flex-wrap justify-end gap-1.5">
      {attachments.map((attachment) => (
        <span
          key={attachment.id}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#262626] px-2.5 py-1 text-xs text-[#D4D4D4]"
        >
          <Paperclip className="size-3 text-[#8C8C8C]" />
          <span className="max-w-44 truncate">{attachment.name}</span>
        </span>
      ))}
    </div>
  )
}

/**
 * Scrollable conversation feed supporting rich markdown/KaTeX/Mermaid responses,
 * attachment chips, collapsible reasoning blocks, and message feedback controls.
 */
export function FactoryConversation({
  messages,
  liked,
  disliked,
  onToggleLike,
  onToggleDislike,
  onCopy,
}: FactoryConversationProps) {
  return (
    <Conversation className="flex-1">
      <ConversationContent className="max-w-3xl mx-auto w-full px-6 pt-6 pb-36 gap-6">
        {messages.map((message) => (
          <Message from={message.from} key={message.id}>
            {message.attachments && message.attachments.length > 0 && (
              <MessageAttachments attachments={message.attachments} />
            )}

            <MessageContent className="select-text">
              {message.reasoning && (
                <AIReasoning className="mb-2" collapseWhenDone isStreaming={false}>
                  <p>{message.reasoning}</p>
                </AIReasoning>
              )}

              {message.from === 'assistant' ? (
                <MessageResponse>{message.content}</MessageResponse>
              ) : (
                message.content
              )}
            </MessageContent>

            {message.from === 'assistant' && message.id !== 'welcome' && (
              <MessageToolbar>
                <MessageActions>
                  <MessageAction
                    label="Like"
                    onClick={() => onToggleLike(message.id)}
                    tooltip="Like this response"
                  >
                    <ThumbsUpIcon
                      className="size-3.5"
                      fill={liked[message.id] ? 'currentColor' : 'none'}
                    />
                  </MessageAction>
                  <MessageAction
                    label="Dislike"
                    onClick={() => onToggleDislike(message.id)}
                    tooltip="Dislike this response"
                  >
                    <ThumbsDownIcon
                      className="size-3.5"
                      fill={disliked[message.id] ? 'currentColor' : 'none'}
                    />
                  </MessageAction>
                  <MessageAction
                    label="Copy"
                    onClick={() => onCopy(message.content)}
                    tooltip="Copy to clipboard"
                  >
                    <CopyIcon className="size-3.5" />
                  </MessageAction>
                </MessageActions>
              </MessageToolbar>
            )}
          </Message>
        ))}
      </ConversationContent>
      <ConversationScrollButton className="bottom-32" />
    </Conversation>
  )
}

