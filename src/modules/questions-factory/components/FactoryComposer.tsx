import type { ChangeEvent, RefObject } from 'react'
import type { AIState } from '@/components/ui/smoothui/ai-core'
import AIPromptInput, { type AIPromptAttachment } from '@/components/ui/smoothui/ai-prompt-input'

interface FactoryComposerProps {
  value: string
  state: AIState
  attachments: AIPromptAttachment[]
  fileInputRef: RefObject<HTMLInputElement>
  onValueChange: (value: string) => void
  onSubmit: (value: string) => void
  onStop: () => void
  onRemoveAttachment: (id: string) => void
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
}

/**
 * Floating prompt composer docked at the bottom of the conversation pane,
 * paired with a hidden file picker input for user attachments.
 */
export function FactoryComposer({
  value,
  state,
  attachments,
  fileInputRef,
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
          />
        </div>
      </div>
    </>
  )
}
