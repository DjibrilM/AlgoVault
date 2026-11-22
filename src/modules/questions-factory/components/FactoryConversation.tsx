import {
  AlertTriangle,
  CopyIcon,
  KeyRound,
  Paperclip,
  RotateCcw,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from 'lucide-react'
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
  onRetryMessage?: (id: string) => void
  onOpenSettings?: () => void
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
 * attachment chips, collapsible reasoning blocks, live agent status, and inline failure/retry controls.
 */
export function FactoryConversation({
  messages,
  liked,
  disliked,
  onToggleLike,
  onToggleDislike,
  onCopy,
  onRetryMessage,
  onOpenSettings,
}: FactoryConversationProps) {
  return (
    <div className="relative flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-9"
        style={{
          background:
            'linear-gradient(to bottom, #1A1A1A 0%, rgba(26, 26, 26, 0.88) 40%, rgba(26, 26, 26, 0) 100%)',
        }}
      />
      <Conversation className="flex-1">
        <ConversationContent className="max-w-3xl mx-auto w-full px-6 pt-7 pb-44 gap-6">
          {messages.map((message) => (
            <Message from={message.from} key={message.id}>
              {message.attachments && message.attachments.length > 0 && (
                <MessageAttachments attachments={message.attachments} />
              )}

              <MessageContent className="select-text">
                {message.reasoning && (
                  <AIReasoning
                    className="mb-2"
                    collapseWhenDone
                    isStreaming={Boolean(message.isStreaming)}
                  >
                    <p>{message.reasoning}</p>
                  </AIReasoning>
                )}

                {message.from === 'assistant' ? (
                  <>
                    {message.content ? (
                      <MessageResponse isAnimating={Boolean(message.isStreaming)}>
                        {message.content}
                      </MessageResponse>
                    ) : message.isStreaming ? (
                      <span className="text-xs text-[#8C8C8C] italic">
                        {message.statusLabel || 'Thinking…'}
                      </span>
                    ) : null}

                    {message.errorInfo && (
                      <div className="mt-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-3.5 py-3 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs font-medium text-rose-300">
                            <AlertTriangle className="size-3.5 shrink-0" />
                            <span>{message.errorInfo.title}</span>
                          </div>
                          {message.retryCount && message.retryCount > 1 && (
                            <span className="text-[11px] text-[#8C8C8C] tabular-nums">
                              Attempt {message.retryCount}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#D4D4D4] leading-relaxed">
                          {message.errorInfo.summary}
                        </p>

                        <p className="text-[11px] text-[#8C8C8C] font-mono break-words">
                          {message.errorInfo.detail}
                        </p>

                        <div className="flex items-center gap-2 pt-0.5">
                          {message.errorInfo.retryable && onRetryMessage && (
                            <button
                              type="button"
                              onClick={() => onRetryMessage(message.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-white hover:bg-[#E5E5E5] px-2.5 py-1 text-[11px] font-semibold text-[#111111] transition-colors cursor-pointer"
                            >
                              <RotateCcw className="size-3" />
                              <span>Retry</span>
                            </button>
                          )}

                          {(message.errorInfo.category === 'api-key' ||
                            message.errorInfo.category === 'rate-limit') &&
                            onOpenSettings && (
                              <button
                                type="button"
                                onClick={onOpenSettings}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-[#D4D4D4] hover:text-white transition-colors cursor-pointer"
                              >
                                <KeyRound className="size-3" />
                                <span>Open API Keys</span>
                              </button>
                            )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  message.content
                )}
              </MessageContent>

              {message.from === 'assistant' &&
                message.id !== 'welcome' &&
                !message.isStreaming &&
                !message.errorInfo && (
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
        <ConversationScrollButton className="bottom-40 bg-[#242426] border-white/10 text-[#E5E5E5] hover:bg-[#2C2C2E] shadow-lg" />
      </Conversation>
    </div>
  )
}
