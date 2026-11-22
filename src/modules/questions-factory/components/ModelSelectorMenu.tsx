import { useMemo } from 'react'
import { Check, ChevronDown, ChevronRight, KeyRound } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  GEMINI_MODEL_PRESETS,
  type AiModelOptionDto,
  type AiProviderId,
} from '@/shared/types/ai'

interface ModelSelectorMenuProps {
  availableModels?: AiModelOptionDto[]
  activeProvider: AiProviderId
  activeModelId: string
  isLoading?: boolean
  disabled?: boolean
  onSelectModel: (modelId: string, provider: AiProviderId) => void
  onOpenSettings?: () => void
}

export function ModelSelectorMenu({
  availableModels = [],
  activeProvider,
  activeModelId,
  isLoading = false,
  disabled = false,
  onSelectModel,
  onOpenSettings,
}: ModelSelectorMenuProps) {
  const models = useMemo(
    () => (availableModels.length > 0 ? availableModels : GEMINI_MODEL_PRESETS),
    [availableModels]
  )

  const activeModel = useMemo(
    () => models.find((m) => m.id === activeModelId),
    [activeModelId, models]
  )

  const displayLabel = activeModel?.name || activeModelId || 'Select model'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        title={activeModelId ? `Model: ${activeModelId}` : 'Select AI model'}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-[#9A9A9A] hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer disabled:opacity-50 outline-none"
      >
        {isLoading && !activeModelId ? (
          <span
            role="status"
            aria-label="Loading models"
            className="h-3 w-24 rounded shimmer-surface"
          />
        ) : (
          <span className="max-w-52 truncate">{displayLabel}</span>
        )}
        <ChevronDown className="size-3.5 text-[#737373] shrink-0" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-[270px] rounded-xl border border-white/[0.08] bg-[#1C1C1F] p-1.5 text-[#E5E5E5] shadow-[0_18px_50px_rgba(0,0,0,0.75)]"
      >
        <div className="px-2.5 pt-1.5 pb-1 text-[11px] font-medium text-[#737373]">
          Model
        </div>

        <div className="max-h-72 overflow-y-auto space-y-0.5 scrollbar-thin">
          {models.map((model) => {
            const isSelected = model.id === activeModelId
            return (
              <DropdownMenuItem
                key={model.id}
                onClick={() => onSelectModel(model.id, activeProvider)}
                className="rounded-lg px-2.5 py-2 flex items-center justify-between gap-2 text-xs hover:bg-white/[0.06] data-[highlighted]:bg-white/[0.06]"
              >
                <span
                  className={cn(
                    'truncate',
                    isSelected ? 'text-white font-medium' : 'text-[#A3A3A3]'
                  )}
                >
                  {model.name}
                </span>

                {isSelected && <Check className="size-3.5 text-emerald-400 shrink-0" />}
              </DropdownMenuItem>
            )
          })}
        </div>

        {onOpenSettings && (
          <>
            <DropdownMenuSeparator className="my-1 h-px bg-white/[0.06]" />
            <DropdownMenuItem
              onClick={onOpenSettings}
              className="rounded-lg px-2.5 py-2 flex items-center justify-between gap-2 text-xs text-[#A3A3A3] hover:text-white hover:bg-white/[0.06] data-[highlighted]:bg-white/[0.06]"
            >
              <span className="flex items-center gap-2">
                <KeyRound className="size-3.5 text-[#737373]" />
                <span>API Keys</span>
              </span>
              <ChevronRight className="size-3.5 text-[#525252] shrink-0" />
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
