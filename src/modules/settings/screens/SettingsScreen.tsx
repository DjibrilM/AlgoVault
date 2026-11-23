import { FormEvent, useState, type FC } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Activity,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  X,
  XCircle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { SettingsScreenProps } from '../types'
import { type StoredApiKeyEntry, useSettings } from '../hooks'

const GOOGLE_AI_STUDIO_KEYS_URL = 'https://aistudio.google.com/api-keys'

function formatCreatedDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Recently'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export const SettingsScreen: FC<SettingsScreenProps> = () => {
  const {
    isLoading,
    entries,
    isAddModalOpen,
    setIsAddModalOpen,
    openAddModal,
    closeAddModal,
    keyNameInput,
    setKeyNameInput,
    apiKeyInput,
    setApiKeyInput,
    formError,
    isSaving,
    copiedKeyId,
    testingKeyId,
    testResultByKey,
    toast,
    dismissToast,
    renamingEntry,
    renameInput,
    setRenameInput,
    openRenameModal,
    closeRenameModal,
    submitRenameKey,
    addApiKey,
    activateApiKey,
    copyApiKey,
    testApiKey,
    deleteApiKey,
  } = useSettings()

  const [showKey, setShowKey] = useState(false)

  const handleAddSubmit = (e: FormEvent) => {
    e.preventDefault()
    void addApiKey()
  }

  const handleRenameSubmit = (e: FormEvent) => {
    e.preventDefault()
    submitRenameKey()
  }

  const renderRow = (entry: StoredApiKeyEntry) => {
    const isTesting = testingKeyId === entry.id
    const isCopied = copiedKeyId === entry.id
    const testResult = testResultByKey[entry.id]

    return (
      <div
        key={entry.id}
        className="grid grid-cols-[minmax(200px,1.8fr)_170px_130px_130px_110px] gap-4 items-center px-1 py-4 border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors"
      >
        {/* Key */}
        <div className="min-w-0 space-y-0.5">
          <div className="font-mono text-xs font-medium text-white">
            {entry.maskedSuffix}
          </div>
          <div className="text-xs text-[#8C8C8C] truncate">{entry.name}</div>
        </div>

        {/* Source & Connection */}
        <div className="min-w-0 space-y-0.5">
          <div className="text-xs text-[#D4D4D4] truncate">
            {entry.apiKey ? 'Saved key' : 'Active key'}
          </div>
          {testResult ? (
            <div
              className={cn(
                'inline-flex items-center gap-1.5 text-[11px] truncate',
                testResult.ok ? 'text-emerald-400' : 'text-rose-400'
              )}
              title={testResult.error}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full shrink-0',
                  testResult.ok ? 'bg-emerald-400' : 'bg-rose-400'
                )}
              />
              <span className="truncate">
                {testResult.ok ? `Connected · ${testResult.latencyMs}ms` : 'Check failed'}
              </span>
            </div>
          ) : (
            <div className="text-[11px] text-[#666666] truncate">Google Gemini API</div>
          )}
        </div>

        {/* Added */}
        <div className="text-xs text-[#9A9A9A] tabular-nums">
          {formatCreatedDate(entry.createdAt)}
        </div>

        {/* Status */}
        <div>
          {entry.isActive ? (
            <span
              className="inline-flex items-center justify-center"
              title="Active API key"
              aria-label="Active API key"
            >
              <Check className="h-4 w-4 text-emerald-400" />
            </span>
          ) : (
            <button
              type="button"
              onClick={() => void activateApiKey(entry)}
              disabled={isSaving || !entry.apiKey}
              className="inline-flex items-center rounded-lg bg-white/[0.03] hover:bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-[#9A9A9A] hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
            >
              Set active
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-1 text-[#8C8C8C]">
          <button
            type="button"
            onClick={() => copyApiKey(entry)}
            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
            title={isCopied ? 'Copied' : 'Copy API key'}
            aria-label="Copy API key"
          >
            {isCopied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => void testApiKey(entry)}
            disabled={isTesting}
            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            title="Verify API key connection"
            aria-label="Verify API key connection"
          >
            {isTesting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
            ) : (
              <Activity className="h-3.5 w-3.5" />
            )}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer outline-none"
              title="Key options"
              aria-label="Key options"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={6}
              className="min-w-[155px] rounded-xl border border-white/[0.08] bg-[#1E1E22] p-1.5 text-[#E5E5E5] shadow-[0_16px_44px_rgba(0,0,0,0.75)]"
            >
              <DropdownMenuItem
                onClick={() => openRenameModal(entry)}
                className="rounded-lg px-2.5 py-2 flex items-center gap-2.5 text-xs text-[#D4D4D4] hover:text-white hover:bg-white/[0.06] data-[highlighted]:bg-white/[0.06]"
              >
                <Pencil className="h-3.5 w-3.5 text-[#8C8C8C]" />
                <span>Rename key</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => void deleteApiKey(entry)}
                className="rounded-lg px-2.5 py-2 flex items-center gap-2.5 text-xs text-[#D4D4D4] hover:text-rose-400 hover:bg-white/[0.06] data-[highlighted]:bg-white/[0.06]"
              >
                <Trash2 className="h-3.5 w-3.5 text-[#8C8C8C]" />
                <span>Delete key</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#1A1A1A] text-[#E5E5E5] overflow-y-auto select-none px-8 py-8 scrollbar-thin">
      <div className="max-w-5xl mx-auto w-full space-y-7">
        {/* Top Bar */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-white">API Keys</h1>
            <p className="text-xs text-[#8C8C8C] max-w-2xl leading-relaxed">
              AlgoVault uses Google Gemini to generate challenges, review your code, and power the Guide chat. Create an API key in{' '}
              <a
                href={GOOGLE_AI_STUDIO_KEYS_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#D4D4D4] hover:text-white underline underline-offset-4 transition-colors"
              >
                <span>Google AI Studio</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              .
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-[#111111] transition-colors hover:bg-[#E5E5E5] cursor-pointer shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add API key</span>
          </button>
        </div>

        {/* Clean Unboxed Keys Table */}
        <div className="overflow-x-auto">
          <div className="min-w-[740px]">
            <div className="grid grid-cols-[minmax(200px,1.8fr)_170px_130px_130px_110px] gap-4 px-1 pb-3 border-b border-white/[0.08] text-[11px] font-medium uppercase tracking-wider text-[#737373]">
              <div>Key</div>
              <div>Provider</div>
              <div>Added</div>
              <div>Status</div>
              <div className="text-right">Actions</div>
            </div>

            {isLoading ? (
              <div className="space-y-2.5 py-4">
                {[0, 1].map((idx) => (
                  <div key={idx} className="h-14 rounded-lg shimmer-surface" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="py-16 text-center space-y-1.5 border-b border-white/[0.06]">
                <p className="text-sm font-medium text-white">No API keys added yet</p>
                <p className="text-xs text-[#737373] max-w-md mx-auto leading-relaxed">
                  Add a Gemini API key to enable challenge generation, feedback, and guide chat.
                </p>
              </div>
            ) : (
              <div>{entries.map(renderRow)}</div>
            )}
          </div>
        </div>
      </div>

      {/* Add API Key Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="w-[min(92vw,580px)] sm:max-w-[580px] bg-[#1C1C1E] border-0 ring-0 text-[#E5E5E5] p-0 overflow-hidden shadow-[0_28px_90px_rgba(0,0,0,0.85)]">
          <DialogHeader className="px-7 pt-6 pb-1">
            <DialogTitle className="text-base font-semibold text-white">
              Add API key
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8C8C8C]">
              Paste a Google Gemini API key and set it as active for AlgoVault.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="px-7 pb-6 pt-4 space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="key-name-input"
                className="text-[11px] font-medium uppercase tracking-wider text-[#737373] block"
              >
                Key Label
              </label>
              <div className="rounded-xl bg-[#131315] px-4 py-3">
                <input
                  id="key-name-input"
                  type="text"
                  value={keyNameInput}
                  onChange={(e) => setKeyNameInput(e.target.value)}
                  placeholder="Personal Key"
                  className="w-full bg-transparent border-0 text-xs font-medium text-white placeholder:text-[#525252] outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="key-value-input"
                className="text-[11px] font-medium uppercase tracking-wider text-[#737373] block"
              >
                Gemini API Key
              </label>
              <div className="rounded-xl bg-[#131315] px-4 py-3 flex items-center gap-3">
                <input
                  id="key-value-input"
                  type={showKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Paste your Gemini API key..."
                  className="w-full bg-transparent border-0 text-xs text-white font-mono placeholder:text-[#525252] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((prev) => !prev)}
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
                  className="text-[#737373] hover:text-white cursor-pointer shrink-0 transition-colors"
                >
                  {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {formError && <p className="text-xs text-rose-400">{formError}</p>}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={closeAddModal}
                className="h-9 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] px-4 text-xs font-medium text-[#D4D4D4] hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="h-9 rounded-lg bg-white hover:bg-[#E5E5E5] px-5 text-xs font-semibold text-[#111111] transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{isSaving ? 'Adding...' : 'Add key'}</span>
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rename API Key Dialog */}
      <Dialog open={Boolean(renamingEntry)} onOpenChange={(open) => !open && closeRenameModal()}>
        <DialogContent className="w-[min(92vw,460px)] sm:max-w-[460px] bg-[#1C1C1E] border-0 ring-0 text-[#E5E5E5] p-0 overflow-hidden shadow-[0_28px_90px_rgba(0,0,0,0.85)]">
          <DialogHeader className="px-7 pt-6 pb-1">
            <DialogTitle className="text-base font-semibold text-white">
              Rename key
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8C8C8C]">
              Update the display label for {renamingEntry?.maskedSuffix}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRenameSubmit} className="px-7 pb-6 pt-4 space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="rename-key-input"
                className="text-[11px] font-medium uppercase tracking-wider text-[#737373] block"
              >
                Key Label
              </label>
              <div className="rounded-xl bg-[#131315] px-4 py-3">
                <input
                  id="rename-key-input"
                  type="text"
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  placeholder="Personal Key"
                  className="w-full bg-transparent border-0 text-xs font-medium text-white placeholder:text-[#525252] outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={closeRenameModal}
                className="h-9 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] px-4 text-xs font-medium text-[#D4D4D4] hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!renameInput.trim()}
                className="h-9 rounded-lg bg-white hover:bg-[#E5E5E5] px-5 text-xs font-semibold text-[#111111] transition-colors cursor-pointer disabled:opacity-45"
              >
                Save
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Live Verification Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            role="status"
            aria-live="polite"
            className="fixed bottom-6 right-6 z-50 rounded-xl bg-[#202024] px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.8)] min-w-[300px] max-w-[380px] flex items-start justify-between gap-3"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <span className="mt-0.5 shrink-0">
                {toast.state === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : toast.state === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-400" />
                )}
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs font-semibold text-white truncate">{toast.title}</p>
                {toast.detail && (
                  <p className="text-[11px] text-[#9A9A9A] leading-snug break-words">
                    {toast.detail}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={dismissToast}
              aria-label="Dismiss notification"
              className="p-1 rounded-md text-[#737373] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SettingsScreen
