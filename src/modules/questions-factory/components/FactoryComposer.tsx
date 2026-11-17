import { type ChangeEvent, type RefObject, useMemo, useState } from 'react'
import { ChevronDown, Cpu } from 'lucide-react'
import type { AIState } from '@/components/ui/smoothui/ai-core'
import AIPromptInput, { type AIPromptAttachment } from '@/components/ui/smoothui/ai-prompt-input'
import type { AiModelOptionDto, AiProviderId } from '@/shared/types/ai'
import { ModelPickerDialog } from './ModelPickerDialog'

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
 * paired with a hidden file picker input and modal model/provider picker.
 */
export function FactoryComposer({
  value,
  state,
  attachments,
  fileInputRef,
  availableModels = [],
  activeProvider = 'gateway',
  activeModelId = '',
  activeBaseUrl,
  isAiConfigured = false,
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
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false)

  const activeModel = useMemo(
    () => availableModels.find((m) => m.id === activeModelId),
    [activeModelId, availableModels]
  )

  const displayLabel = activeModel?.name || activeModelId || 'Select model'

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={onFileChange}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/85 to-transparent px-6 pt-8 pb-5">
        <div className="pointer-events-auto max-w-3xl mx-auto">
          <AIPromptInput
            aria-label="Questions Factory prompt"
            attachments={attachments}
            className="rounded-2xl border-white/[0.08] bg-[#1E1E1E] shadow-2xl"
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
              <button
                type="button"
                onClick={() => setIsModelDialogOpen(true)}
                disabled={isSwitchingModel || state === 'thinking' || state === 'streaming'}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-[#D4D4D4] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                title={activeModelId ? `Model: ${activeModelId}` : 'Select AI provider & model'}
              >
                <Cpu className="size-3.5 text-[#8C8C8C] shrink-0" />
                {isModelsLoading && !activeModelId ? (
                  <span
                    role="status"
                    aria-label="Loading models"
                    className="h-3 w-24 rounded shimmer-surface"
                  />
                ) : (
                  <span className="max-w-52 truncate">{displayLabel}</span>
                )}
                <ChevronDown className="size-3 text-[#737373] shrink-0" />
              </button>
            )}
          </AIPromptInput>
        </div>
      </div>

      {onSelectModel && (
        <ModelPickerDialog
          open={isModelDialogOpen}
          onOpenChange={setIsModelDialogOpen}
          activeProvider={activeProvider}
          activeModelId={activeModelId}
          activeBaseUrl={activeBaseUrl}
          isConfigured={isAiConfigured}
          isSwitchingModel={isSwitchingModel}
          onSelectModel={onSelectModel}
          onOpenSettings={onOpenSettings}
        />
      )}
    </>
  )
}
