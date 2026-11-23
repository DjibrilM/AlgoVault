import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Cpu, Search, Settings2, X } from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useAiModelsQuery } from '@/shared/hooks/useWorkspaceQueries'
import {
  AI_PROVIDER_DEFAULTS,
  AI_PROVIDER_ORDER,
  formatModelProviderLabel,
  groupModelsByProvider,
  type AiProviderId,
} from '@/shared/types/ai'

interface ModelPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeProvider: AiProviderId
  activeModelId: string
  activeBaseUrl?: string
  isConfigured?: boolean
  isSwitchingModel?: boolean
  onSelectModel: (modelId: string, provider: AiProviderId) => void
  onOpenSettings?: () => void
}

const SHORT_PROVIDER_LABELS: Record<AiProviderId, string> = {
  gateway: 'AI Gateway',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google Gemini',
  'openai-compatible': 'Local / OpenAI-Compatible',
}

const SHIMMER_CARD_WIDTHS = [
  { title: 'w-36', id: 'w-52', desc: 'w-4/5' },
  { title: 'w-44', id: 'w-48', desc: 'w-3/4' },
  { title: 'w-32', id: 'w-56', desc: 'w-2/3' },
  { title: 'w-40', id: 'w-44', desc: 'w-5/6' },
  { title: 'w-36', id: 'w-52', desc: 'w-3/4' },
]

function ModelListShimmer() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading available models"
      className="space-y-4"
    >
      <span className="sr-only">Loading available models...</span>
      {[0, 1].map((sectionIdx) => (
        <div key={sectionIdx} className="space-y-1.5">
          <div className="px-1">
            <div className="h-3 w-20 rounded shimmer-surface" />
          </div>
          <div className="space-y-1.5">
            {SHIMMER_CARD_WIDTHS.slice(0, sectionIdx === 0 ? 3 : 2).map((widths, rowIdx) => (
              <div
                key={rowIdx}
                className="rounded-lg border border-white/[0.04] bg-[#161616]/50 px-3 py-2.5 space-y-2"
              >
                <div className={cn('h-3.5 rounded shimmer-surface', widths.title)} />
                <div className={cn('h-2.5 rounded shimmer-surface', widths.id)} />
                <div className={cn('h-2.5 rounded shimmer-surface', widths.desc)} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * High-visibility modal dialog for switching AI backend providers,
 * browsing models grouped by provider, and selecting the active model.
 */
export function ModelPickerDialog({
  open,
  onOpenChange,
  activeProvider,
  activeModelId,
  activeBaseUrl,
  isConfigured = false,
  isSwitchingModel = false,
  onSelectModel,
  onOpenSettings,
}: ModelPickerDialogProps) {
  const [browsedProvider, setBrowsedProvider] = useState<AiProviderId>(activeProvider)
  const [selectedSourceProvider, setSelectedSourceProvider] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setBrowsedProvider(activeProvider)
    setSelectedSourceProvider('all')
    setSearchQuery('')
  }, [activeProvider, open])

  const browsedBaseUrl = browsedProvider === activeProvider ? activeBaseUrl : undefined
  const {
    data: browsedModels = [],
    isLoading: isModelsLoading,
    isFetching: isModelsFetching,
  } = useAiModelsQuery(browsedProvider, browsedBaseUrl, open)
  const showLoadingShimmer =
    isModelsLoading || (isModelsFetching && browsedModels.length === 0)

  const allGroups = useMemo(
    () => groupModelsByProvider(browsedModels),
    [browsedModels]
  )

  const queryMatchedModels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return browsedModels
    return browsedModels.filter(
      (model) =>
        model.id.toLowerCase().includes(q) ||
        model.name.toLowerCase().includes(q) ||
        model.provider.toLowerCase().includes(q) ||
        formatModelProviderLabel(model.provider).toLowerCase().includes(q) ||
        (model.description?.toLowerCase().includes(q) ?? false)
    )
  }, [browsedModels, searchQuery])

  const matchingGroups = useMemo(
    () => groupModelsByProvider(queryMatchedModels),
    [queryMatchedModels]
  )

  const matchCountsByProvider = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const group of matchingGroups) {
      counts[group.provider] = group.models.length
    }
    return counts
  }, [matchingGroups])

  const effectiveSourceFilter = useMemo(() => {
    if (selectedSourceProvider === 'all') return 'all'
    return allGroups.some((g) => g.provider === selectedSourceProvider)
      ? selectedSourceProvider
      : 'all'
  }, [allGroups, selectedSourceProvider])

  const visibleGroups = useMemo(() => {
    if (effectiveSourceFilter === 'all') return matchingGroups
    return matchingGroups.filter((group) => group.provider === effectiveSourceFilter)
  }, [effectiveSourceFilter, matchingGroups])

  const hasMultipleSources = allGroups.length > 1
  const showProviderSidebar =
    hasMultipleSources || (showLoadingShimmer && browsedProvider === 'gateway')

  const handleBackendChange = (nextProvider: AiProviderId) => {
    setBrowsedProvider(nextProvider)
    setSelectedSourceProvider('all')
    setSearchQuery('')
  }

  const handlePickModel = (modelId: string) => {
    onSelectModel(modelId, browsedProvider)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        initialFocus={searchInputRef}
        className="w-[min(92vw,760px)] sm:max-w-[760px] h-[min(82vh,580px)] flex flex-col gap-0 p-0 overflow-hidden bg-[#1A1A1A] border-0 ring-0 text-[#E5E5E5] shadow-[0_28px_90px_rgba(0,0,0,0.85)]"
      >
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-white/[0.06] shrink-0 gap-1 pr-12">
          <DialogTitle className="text-sm font-semibold text-white">
            Gemini Models
          </DialogTitle>
          <DialogDescription className="text-xs text-[#8C8C8C]">
            Pick an active Google Gemini model for your AI agents.
          </DialogDescription>
        </DialogHeader>

        {/* Connection Provider Selector + Search */}
        <div className="px-5 py-3 border-b border-white/[0.06] bg-[#161616] space-y-2.5 shrink-0">
          {AI_PROVIDER_ORDER.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Backend provider">
              {AI_PROVIDER_ORDER.map((providerId) => {
                const isSelected = browsedProvider === providerId
                const isActive = activeProvider === providerId
                return (
                  <button
                    key={providerId}
                    type="button"
                    onClick={() => handleBackendChange(providerId)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                      isSelected
                        ? 'border-white/25 bg-white/[0.1] text-white'
                        : 'border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.06] text-[#9A9A9A] hover:text-white'
                    )}
                  >
                    {isActive && (
                      <span
                        className={cn(
                          'size-1.5 rounded-full shrink-0',
                          isConfigured ? 'bg-emerald-400' : 'bg-[#737373]'
                        )}
                        title={isConfigured ? 'Active & configured' : 'Current provider'}
                      />
                    )}
                    <span>{SHORT_PROVIDER_LABELS[providerId]}</span>
                  </button>
                )
              })}
            </div>
          )}

          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 size-3.5 text-[#737373]" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${browsedModels.length > 0 ? `${browsedModels.length} ` : ''}Gemini models by name or ID...`}
              aria-label="Search models"
              className="w-full h-9 rounded-lg border border-white/[0.08] bg-[#121212] pl-9 pr-8 text-xs text-white placeholder:text-[#525252] outline-none focus:border-white/25 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 text-[#737373] hover:text-white cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Two-pane Provider & Model Browser */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {showProviderSidebar && (
            <aside
              aria-label="Model providers"
              className="w-48 shrink-0 border-r border-white/[0.06] bg-[#151515] overflow-y-auto overscroll-contain p-2 space-y-0.5"
            >
              {showLoadingShimmer ? (
                <div className="space-y-1.5 p-0.5" aria-hidden="true">
                  <div className="h-7 w-full rounded-md shimmer-surface" />
                  <div className="my-1.5 h-px bg-white/[0.06]" />
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <div key={idx} className="h-7 w-full rounded-md shimmer-surface" />
                  ))}
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedSourceProvider('all')}
                    className={cn(
                      'w-full flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                      effectiveSourceFilter === 'all'
                        ? 'bg-white/[0.09] text-white'
                        : 'text-[#9A9A9A] hover:bg-white/[0.04] hover:text-white'
                    )}
                  >
                    <span className="truncate">All Providers</span>
                    <span className="text-[10px] tabular-nums text-[#737373]">
                      {queryMatchedModels.length}
                    </span>
                  </button>

                  <div className="my-1.5 h-px bg-white/[0.06]" />

                  {allGroups.map((group) => {
                    const count = matchCountsByProvider[group.provider] ?? 0
                    const isSelected = effectiveSourceFilter === group.provider
                    return (
                      <button
                        key={group.provider}
                        type="button"
                        onClick={() => setSelectedSourceProvider(group.provider)}
                        className={cn(
                          'w-full flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors cursor-pointer',
                          isSelected
                            ? 'bg-white/[0.09] text-white font-medium'
                            : 'text-[#A3A3A3] hover:bg-white/[0.04] hover:text-white',
                          count === 0 && !isSelected && 'opacity-45'
                        )}
                      >
                        <span className="truncate">{group.label}</span>
                        <span className="text-[10px] tabular-nums text-[#737373]">{count}</span>
                      </button>
                    )
                  })}
                </>
              )}
            </aside>
          )}

          <div className="flex-1 min-w-0 overflow-y-auto overscroll-contain p-3.5 space-y-4">
            {showLoadingShimmer ? (
              <ModelListShimmer />
            ) : visibleGroups.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-center py-8">
                <p className="text-xs text-[#8C8C8C]">
                  No models matched &ldquo;{searchQuery}&rdquo;.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedSourceProvider('all')
                  }}
                  className="rounded-md border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1 text-[11px] text-[#E5E5E5] cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              visibleGroups.map((group) => (
                <section key={group.provider} className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[11px] font-medium uppercase tracking-wider text-[#737373]">
                      {group.label}
                    </h3>
                    <span className="text-[10px] text-[#525252] tabular-nums">
                      {group.models.length}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {group.models.map((model) => {
                      const isSelected =
                        model.id === activeModelId && browsedProvider === activeProvider
                      return (
                        <button
                          key={model.id}
                          type="button"
                          disabled={isSwitchingModel}
                          onClick={() => handlePickModel(model.id)}
                          className={cn(
                            'w-full text-left rounded-lg border px-3 py-2.5 flex items-start justify-between gap-3 transition-colors cursor-pointer disabled:opacity-50',
                            isSelected
                              ? 'border-white/25 bg-white/[0.08]'
                              : 'border-white/[0.04] bg-[#161616]/50 hover:border-white/[0.12] hover:bg-white/[0.04]'
                          )}
                        >
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[13px] font-medium text-[#F5F5F5] truncate">
                                {model.name}
                              </span>
                              {isSelected && (
                                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-[#E5E5E5] shrink-0">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#8C8C8C] font-mono truncate">
                              {model.id}
                            </div>
                            {model.description && (
                              <p className="text-[11px] text-[#737373] leading-snug line-clamp-2 pt-0.5">
                                {model.description}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="size-4 text-white shrink-0 mt-0.5" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.06] bg-[#161616] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0 text-[11px] text-[#8C8C8C]">
            <Cpu className="size-3.5 text-[#8C8C8C] shrink-0" />
            <span className="truncate">
              {browsedProvider === activeProvider
                ? `${AI_PROVIDER_DEFAULTS[activeProvider].label}${activeModelId ? ` · ${activeModelId}` : ''}`
                : `Selecting a model switches to ${AI_PROVIDER_DEFAULTS[browsedProvider].label}`}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false)
                  onOpenSettings()
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-[#D4D4D4] hover:text-white transition-colors cursor-pointer"
              >
                <Settings2 className="size-3.5 text-[#8C8C8C]" />
                <span>API Keys</span>
              </button>
            )}
            <DialogClose
              render={
                <button
                  type="button"
                  className="inline-flex items-center rounded-md border border-white/10 bg-transparent hover:bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
                >
                  Close
                </button>
              }
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
