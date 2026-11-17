import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  PlugZap,
  Search,
  Server,
  Trash2,
  XCircle,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  AI_PROVIDER_DEFAULTS,
  AI_PROVIDER_ORDER,
  getModelProviderKey,
  groupModelsByProvider,
} from '@/shared/types/ai'
import { SettingsScreenProps } from '../types'
import { useSettings } from '../hooks'

export function SettingsScreen({ onReturnHome }: SettingsScreenProps) {
  const {
    status,
    availableModels,
    isModelsLoading,
    isLoading,
    provider,
    modelId,
    setModelId,
    selectModel,
    baseUrl,
    setBaseUrl,
    apiKeyInput,
    setApiKeyInput,
    clearStoredKey,
    setClearStoredKey,
    selectProvider,
    handleSave,
    handleTest,
    isSaving,
    isTesting,
    testResult,
    saveFeedback,
    returnHome,
  } = useSettings()

  const [showKey, setShowKey] = useState(false)
  const [modelGroupFilter, setModelGroupFilter] = useState<string | null>(null)
  const [modelQuery, setModelQuery] = useState('')
  const defaults = AI_PROVIDER_DEFAULTS[provider]
  const hasSavedKeyForProvider = Boolean(
    status?.hasApiKey && status.provider === provider && !clearStoredKey
  )

  useEffect(() => {
    setModelGroupFilter(null)
    setModelQuery('')
  }, [provider])

  const groupedModels = useMemo(
    () => groupModelsByProvider(availableModels),
    [availableModels]
  )

  const currentModelProviderKey = useMemo(
    () => getModelProviderKey({ id: modelId, provider }),
    [modelId, provider]
  )

  const activeGroupKey = useMemo(() => {
    if (modelQuery.trim()) return 'all'
    if (
      modelGroupFilter &&
      (modelGroupFilter === 'all' ||
        groupedModels.some((group) => group.provider === modelGroupFilter))
    ) {
      return modelGroupFilter
    }
    if (
      groupedModels.length > 1 &&
      groupedModels.some((group) => group.provider === currentModelProviderKey)
    ) {
      return currentModelProviderKey
    }
    return groupedModels.length > 1 ? (groupedModels[0]?.provider ?? 'all') : 'all'
  }, [currentModelProviderKey, groupedModels, modelGroupFilter, modelQuery])

  const visibleModels = useMemo(() => {
    const q = modelQuery.trim().toLowerCase()
    const base =
      activeGroupKey === 'all'
        ? availableModels
        : groupedModels.find((group) => group.provider === activeGroupKey)?.models ??
          availableModels
    if (!q) return base
    return base.filter(
      (model) =>
        model.id.toLowerCase().includes(q) ||
        model.name.toLowerCase().includes(q) ||
        model.provider.toLowerCase().includes(q)
    )
  }, [activeGroupKey, availableModels, groupedModels, modelQuery])

  return (
    <div className="h-full flex flex-col bg-[#1A1A1A] text-[#E5E5E5] overflow-y-auto select-none">
      {/* Header */}
      <header className="h-12 px-6 border-b border-white/[0.06] bg-[#171717] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onReturnHome ?? returnHome}
            className="inline-flex items-center gap-1.5 text-xs text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-white" />
            <span>Back to Home</span>
          </button>
          <span className="h-4 w-px bg-white/10" />
          <span className="text-xs font-semibold text-white">Settings</span>
        </div>

        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium',
            status?.configured
              ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
              : 'border-white/[0.08] bg-white/[0.04] text-[#8C8C8C]'
          )}
        >
          <span
            className={cn(
              'size-1.5 rounded-full',
              status?.configured ? 'bg-emerald-400' : 'bg-[#737373]'
            )}
          />
          {isLoading
            ? 'Checking AI status...'
            : status?.configured
              ? `${AI_PROVIDER_DEFAULTS[status.provider].label} (${status.source})`
              : 'AI Provider Not Configured'}
        </span>
      </header>

      {/* Main Content */}
      <div className="max-w-3xl w-full mx-auto px-8 py-8 space-y-8">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-white">
            <Cpu className="size-4 text-[#8C8C8C]" />
            <h1 className="text-lg font-semibold tracking-tight">AI Agents & Provider</h1>
          </div>
          <p className="text-xs text-[#8C8C8C] leading-relaxed">
            Configure the model backend powering Questions Factory&apos;s Master Agent, Catalog Analyst, and Challenge Architect. Credentials stay stored locally on your machine or come from environment variables.
          </p>
        </div>

        {/* Provider Cards */}
        <section className="space-y-3">
          <label className="text-xs font-medium text-[#A3A3A3]">Model Provider</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {AI_PROVIDER_ORDER.map((id) => {
              const info = AI_PROVIDER_DEFAULTS[id]
              const selected = provider === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectProvider(id)}
                  className={cn(
                    'text-left rounded-xl border p-3.5 transition-all cursor-pointer space-y-1',
                    selected
                      ? 'border-[#A855F7]/60 bg-[#A855F7]/10 text-white'
                      : 'border-white/[0.07] bg-[#161616] hover:border-white/15 hover:bg-[#1E1E1E] text-[#D4D4D4]'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold">{info.label}</span>
                    {id === 'openai-compatible' && (
                      <Server className="size-3.5 text-[#8C8C8C] shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#8C8C8C] leading-snug">
                    {info.description}
                  </p>
                </button>
              )
            })}
          </div>
        </section>

        {/* Connection Form */}
        <section className="rounded-xl border border-white/[0.07] bg-[#161616] p-5 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#D4D4D4]" htmlFor="ai-model-id">
              Model ID
            </label>
            <Input
              id="ai-model-id"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              placeholder={defaults.modelId}
              className="h-9 bg-[#111111] border-white/10 text-xs text-white placeholder:text-[#525252] font-mono"
            />
            {isModelsLoading ? (
              <div
                role="status"
                aria-busy="true"
                aria-label="Loading models"
                className="space-y-2.5 pt-1"
              >
                <span className="sr-only">Loading models...</span>
                <div className="flex flex-wrap gap-1.5">
                  <div className="h-6 w-20 rounded-md shimmer-surface" />
                  <div className="h-6 w-16 rounded-md shimmer-surface" />
                  <div className="h-6 w-16 rounded-md shimmer-surface" />
                  <div className="h-6 w-20 rounded-md shimmer-surface" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <div className="h-7 w-28 rounded-md shimmer-surface" />
                  <div className="h-7 w-32 rounded-md shimmer-surface" />
                  <div className="h-7 w-24 rounded-md shimmer-surface" />
                  <div className="h-7 w-36 rounded-md shimmer-surface" />
                  <div className="h-7 w-28 rounded-md shimmer-surface" />
                </div>
              </div>
            ) : availableModels.length > 0 && (
              <div className="space-y-2.5 pt-1">
                {(groupedModels.length > 1 || availableModels.length > 12) && (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {groupedModels.length > 1 && (
                      <div className="flex flex-wrap items-center gap-1">
                        {groupedModels.map((group) => {
                          const selectedGroup = activeGroupKey === group.provider
                          return (
                            <button
                              key={group.provider}
                              type="button"
                              onClick={() => {
                                setModelQuery('')
                                setModelGroupFilter(group.provider)
                              }}
                              className={cn(
                                'rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer',
                                selectedGroup
                                  ? 'border-white/25 bg-white/[0.1] text-white'
                                  : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-[#8C8C8C] hover:text-[#D4D4D4]'
                              )}
                            >
                              {group.label}
                              <span className="ml-1 text-[10px] text-[#737373]">
                                {group.models.length}
                              </span>
                            </button>
                          )
                        })}
                        <button
                          type="button"
                          onClick={() => setModelGroupFilter('all')}
                          className={cn(
                            'rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer',
                            activeGroupKey === 'all' && !modelQuery.trim()
                              ? 'border-white/25 bg-white/[0.1] text-white'
                              : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-[#8C8C8C] hover:text-[#D4D4D4]'
                          )}
                        >
                          All
                        </button>
                      </div>
                    )}

                    {availableModels.length > 12 && (
                      <div className="relative flex items-center ml-auto">
                        <Search className="pointer-events-none absolute left-2 size-3 text-[#6E6E6E]" />
                        <input
                          type="text"
                          value={modelQuery}
                          onChange={(e) => setModelQuery(e.target.value)}
                          placeholder="Filter models..."
                          className="h-7 w-44 rounded-md border border-white/[0.08] bg-[#111111] pl-7 pr-2 text-[11px] text-[#E5E5E5] placeholder:text-[#525252] outline-none focus:border-white/20"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="max-h-44 overflow-y-auto flex flex-wrap gap-1.5 pr-1">
                  {visibleModels.length === 0 ? (
                    <span className="text-[11px] text-[#737373]">No matching models</span>
                  ) : (
                    visibleModels.map((model) => {
                      const active = modelId === model.id
                      return (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => selectModel(model.id)}
                          title={model.description || model.id}
                          className={cn(
                            'rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer',
                            active
                              ? 'border-white/30 bg-white/[0.12] text-white'
                              : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] text-[#A3A3A3] hover:text-white'
                          )}
                        >
                          {model.name}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-medium text-[#D4D4D4]" htmlFor="ai-base-url">
                {provider === 'openai-compatible' ? 'Server Base URL' : 'Custom Base URL (Optional)'}
              </label>
              {provider === 'openai-compatible' && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBaseUrl('http://127.0.0.1:1234/v1')}
                    className="rounded-md border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-2 py-0.5 text-[10px] text-[#D4D4D4] cursor-pointer"
                  >
                    LM Studio (:1234)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBaseUrl('http://127.0.0.1:11434/v1')}
                    className="rounded-md border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-2 py-0.5 text-[10px] text-[#D4D4D4] cursor-pointer"
                  >
                    Ollama (:11434)
                  </button>
                </div>
              )}
            </div>
            <Input
              id="ai-base-url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={defaults.baseUrl || 'Leave blank for default provider endpoint'}
              className="h-9 bg-[#111111] border-white/10 text-xs text-white placeholder:text-[#525252] font-mono"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-medium text-[#D4D4D4] flex items-center gap-1.5" htmlFor="ai-api-key">
                <KeyRound className="size-3.5 text-[#8C8C8C]" />
                <span>API Key</span>
              </label>
              {hasSavedKeyForProvider && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-[#8C8C8C]">
                    Saved: {status?.maskedApiKey}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setClearStoredKey(true)
                      setApiKeyInput('')
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer"
                  >
                    <Trash2 className="size-3" />
                    <span>Clear</span>
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <Input
                id="ai-api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value)
                  if (e.target.value) setClearStoredKey(false)
                }}
                placeholder={
                  hasSavedKeyForProvider
                    ? 'Enter a new key to replace the saved key'
                    : defaults.placeholderKey
                }
                className="h-9 pr-9 bg-[#111111] border-white/10 text-xs text-white placeholder:text-[#525252] font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey((prev) => !prev)}
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-white cursor-pointer"
              >
                {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
          </div>

          {/* Feedback */}
          {testResult && (
            <div
              className={cn(
                'rounded-lg border px-3 py-2.5 text-xs flex items-start gap-2 select-text',
                testResult.ok
                  ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
                  : 'border-rose-500/25 bg-rose-500/10 text-rose-200'
              )}
            >
              {testResult.ok ? (
                <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-400" />
              ) : (
                <XCircle className="size-4 shrink-0 mt-0.5 text-rose-400" />
              )}
              <div className="space-y-0.5 min-w-0">
                <div className="font-medium">
                  {testResult.ok
                    ? `Connected to ${testResult.modelId} (${testResult.latencyMs} ms)`
                    : 'Connection failed'}
                </div>
                {testResult.error && (
                  <p className="text-[11px] opacity-90 break-words">{testResult.error}</p>
                )}
              </div>
            </div>
          )}

          {saveFeedback && (
            <p className="text-xs text-emerald-400">{saveFeedback}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => void handleTest()}
              disabled={isTesting || isSaving}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-3.5 py-1.5 text-xs font-medium text-[#E5E5E5] transition-colors cursor-pointer disabled:opacity-50"
            >
              {isTesting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <PlugZap className="size-3.5 text-[#A855F7]" />
              )}
              <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving || isTesting}
              className="inline-flex items-center gap-1.5 rounded-md bg-white hover:bg-[#E5E5E5] px-4 py-1.5 text-xs font-semibold text-[#111111] transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaving && <Loader2 className="size-3.5 animate-spin" />}
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default SettingsScreen
