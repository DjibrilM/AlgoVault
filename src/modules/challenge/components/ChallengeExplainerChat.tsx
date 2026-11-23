import {
  CopyIcon,
  Paperclip,
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
import AIPromptInput, { type AIPromptAttachment } from '@/components/ui/smoothui/ai-prompt-input'
import AIReasoning from '@/components/ui/smoothui/ai-reasoning'
import { ModelSelectorMenu } from '@/modules/questions-factory/components/ModelSelectorMenu'
import type { Problem, SupportedLang } from '@/shared/types/problem'
import { useChallengeExplainerChat } from '../hooks/useChallengeExplainerChat'

interface ChallengeExplainerChatProps {
  problem: Problem
  currentCode?: string
  selectedLang?: SupportedLang
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
 * Challenge Explainer conversational UI embedded in the Problem Description pane,
 * mirroring Questions Factory's conversation feed and floating prompt composer.
 */
export function ChallengeExplainerChat({
  problem,
  currentCode,
  selectedLang,
}: ChallengeExplainerChatProps) {
  const {
    messages,
    promptText,
    setPromptText,
    attachments,
    fileInputRef,
    liked,
    disliked,
    effectiveState,
    availableModels,
    isModelsLoading,
    activeProvider,
    activeModelId,
    isSwitchingModel,
    switchModel,
    openAiSettings,
    handleSubmit,
    stopAiActivity,
    handleFileChange,
    removeAttachment,
    handleToggleLike,
    handleToggleDislike,
    handleCopy,
  } = useChallengeExplainerChat({
    problem,
    currentCode,
    selectedLang,
  })

  return (
    <div className="relative flex-1 flex flex-col min-w-0 min-h-0 bg-[#1A1A1A] overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-9"
        style={{
          background:
            'linear-gradient(to bottom, #1A1A1A 0%, rgba(26, 26, 26, 0.88) 40%, rgba(26, 26, 26, 0) 100%)',
        }}
      />

      <Conversation className="flex-1">
        <ConversationContent className="max-w-3xl mx-auto w-full px-5 pt-7 pb-44 gap-5">
          {messages
            .filter(
              (message) =>
                !(
                  message.id.startsWith('welcome') &&
                  messages.some((m) => m.from === 'user')
                )
            )
            .map((message) => (
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
                  message.content ? (
                    <MessageResponse isAnimating={Boolean(message.isStreaming)}>
                      {message.content}
                    </MessageResponse>
                  ) : message.isStreaming ? (
                    <span className="text-xs text-[#737373] italic">Thinking…</span>
                  ) : null
                ) : (
                  message.content
                )}
              </MessageContent>

              {message.from === 'assistant' &&
                !message.id.startsWith('welcome') &&
                !message.isStreaming && (
                  <MessageToolbar>
                    <MessageActions>
                      <MessageAction
                        label="Like"
                        onClick={() => handleToggleLike(message.id)}
                        tooltip="Like this response"
                      >
                        <ThumbsUpIcon
                          className="size-3.5"
                          fill={liked[message.id] ? 'currentColor' : 'none'}
                        />
                      </MessageAction>
                      <MessageAction
                        label="Dislike"
                        onClick={() => handleToggleDislike(message.id)}
                        tooltip="Dislike this response"
                      >
                        <ThumbsDownIcon
                          className="size-3.5"
                          fill={disliked[message.id] ? 'currentColor' : 'none'}
                        />
                      </MessageAction>
                      <MessageAction
                        label="Copy"
                        onClick={() => handleCopy(message.content)}
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

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col">
        <div
          aria-hidden
          className="h-12 w-full"
          style={{
            background:
              'linear-gradient(to top, #1A1A1A 0%, rgba(26, 26, 26, 0.9) 45%, rgba(26, 26, 26, 0) 100%)',
          }}
        />
        <div className="pointer-events-auto bg-[#1A1A1A] px-4 pb-3.5 pt-0.5">
          <div className="max-w-3xl mx-auto">
            <AIPromptInput
              aria-label="Ask Guide"
              attachments={attachments}
              maxLength={2000}
              onAttach={() => fileInputRef.current?.click()}
              onRemoveAttachment={removeAttachment}
              onStop={stopAiActivity}
              onSubmit={(val) => void handleSubmit(val)}
              onValueChange={setPromptText}
              placeholder={`Ask about "${problem.title}"…`}
              state={effectiveState}
              value={promptText}
            >
              <ModelSelectorMenu
                availableModels={availableModels}
                activeProvider={activeProvider}
                activeModelId={activeModelId}
                isLoading={isModelsLoading}
                disabled={
                  isSwitchingModel ||
                  effectiveState === 'thinking' ||
                  effectiveState === 'streaming'
                }
                onSelectModel={(modelId, provider) => void switchModel(modelId, provider)}
                onOpenSettings={openAiSettings}
              />
            </AIPromptInput>
          </div>
        </div>
      </div>
    </div>
  )
}
