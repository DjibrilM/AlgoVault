import { type ChangeEvent, type RefObject } from 'react'
import type { AIState } from '@/components/ui/smoothui/ai-core'
import AIPromptInput, { type AIPromptAttachment } from '@/components/ui/smoothui/ai-prompt-input'
import type { AiModelOptionDto, AiProviderId } from '@/shared/types/ai'
import { ModelSelectorMenu } from './ModelSelectorMenu'

interface FactoryComposerProps {
  value: string
  state: AIState
  attachments: AIPromptAttachment[]
  fileInputRef: RefObject<HTMLInputElement>
  availableModels?: AiModelOptionDto[]
  activeProvider?: AiProviderId
  activeModelId?: string
  activeBaseUrl?: string
  isAiConfigured?: boolean
  isModelsLoading?: boolean
  isSwitchingModel?: boolean
  onSelectModel?: (modelId: string, provider: AiProviderId) => void
  onOpenSettings?: () => void
  onValueChange: (value: string) => void
  onSubmit: (value: string) => void
  onStop: () => void
  onRemoveAttachment: (id: string) => void
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
}

/**
 * Floating prompt composer docked at the bottom of the conversation pane,
 * paired with a hidden file picker input and anchored model selector menu.
 */
export function FactoryComposer({
  value,
  state,
  attachments,
  fileInputRef,
  availableModels = [],
  activeProvider = 'google',
  activeModelId = '',
  isModelsLoading = false,
  isSwitchingModel = false,
  onSelectModel,
  onOpenSettings,
  onValueChange,
  onSubmit,
  onStop,
  onRemoveAttachment,
  onFileChange,
}: FactoryComposerProps) {
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={onFileChange}
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
        <div className="pointer-events-auto bg-[#1A1A1A] px-6 pb-5 pt-0.5">
          <div className="max-w-3xl mx-auto">
            <AIPromptInput
              aria-label="Questions Factory prompt"
              attachments={attachments}
              maxLength={2000}
              onAttach={() => fileInputRef.current?.click()}
              onRemoveAttachment={onRemoveAttachment}
              onStop={onStop}
              onSubmit={onSubmit}
              onValueChange={onValueChange}
              placeholder="Ask anything…"
              state={state}
              value={value}
            >
              {onSelectModel && (
                <ModelSelectorMenu
                  availableModels={availableModels}
                  activeProvider={activeProvider}
                  activeModelId={activeModelId}
                  isLoading={isModelsLoading}
                  disabled={
                    isSwitchingModel || state === 'thinking' || state === 'streaming'
                  }
                  onSelectModel={onSelectModel}
                  onOpenSettings={onOpenSettings}
                />
              )}
            </AIPromptInput>
          </div>
        </div>
      </div>
    </>
  )
}
