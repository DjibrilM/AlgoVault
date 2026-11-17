import { type RefObject, useEffect, useRef, useState } from 'react'
import { ArrowLeft, History, Play, Settings2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { AiProviderStatusDto } from '@/shared/types/ai'

const SIMULATION_REAPPEAR_DELAY_MS = 10_000

interface FactoryHeaderProps {
  orbSlotRef: RefObject<HTMLDivElement>
  isSimulating: boolean
  isHistoryOpen: boolean
  aiStatus?: AiProviderStatusDto
  onBackToHome: () => void
  onOpenSettings?: () => void
  onToggleSimulation: () => void
  onToggleHistory: () => void
}

/**
 * Top sub-header displaying back navigation, the anchored AI orb slot,
 * AI provider status badge, pipeline simulation control, and history drawer trigger.
 */
export function FactoryHeader({
  orbSlotRef,
  isSimulating,
  isHistoryOpen,
  aiStatus,
  onBackToHome,
  onOpenSettings,
  onToggleSimulation,
  onToggleHistory,
}: FactoryHeaderProps) {
  const [showSimulateButton, setShowSimulateButton] = useState(!isSimulating)
  const wasSimulatingRef = useRef(isSimulating)

  useEffect(() => {
    if (isSimulating) {
      wasSimulatingRef.current = true
      setShowSimulateButton(false)
      return
    }

    if (!wasSimulatingRef.current) {
      setShowSimulateButton(true)
      return
    }

    // Keep the trigger hidden for 10s after demo completion; reset ref only once timeout fires (StrictMode-safe)
    const timerId = window.setTimeout(() => {
      wasSimulatingRef.current = false
      setShowSimulateButton(true)
    }, SIMULATION_REAPPEAR_DELAY_MS)

    return () => window.clearTimeout(timerId)
  }, [isSimulating])

  return (
    <header className="h-12 px-6 border-b border-white/[0.06] bg-[#171717] flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-white" />
          <span>Back to Home</span>
        </button>
        <span className="h-4 w-px bg-white/10" />
        <div className="flex items-center gap-2.5">
          {/* Reserves the corner slot where the single persistent AIOrbFace docks at rest */}
          <div ref={orbSlotRef} aria-hidden className="w-7 h-7 shrink-0" />
          <span className="text-xs font-semibold text-white">Questions Factory</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {aiStatus && onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            title={
              aiStatus.configured
                ? `Active model: ${aiStatus.modelId} (${aiStatus.source})`
                : 'Configure an AI provider in Settings'
            }
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer',
              aiStatus.configured
                ? 'border-emerald-500/20 bg-emerald-500/[0.08] hover:bg-emerald-500/[0.14] text-emerald-300'
                : 'border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-[#A3A3A3] hover:text-white'
            )}
          >
            <Settings2 className="size-3 shrink-0" />
            <span className="max-w-36 truncate">
              {aiStatus.configured ? aiStatus.modelId : 'Setup AI Model'}
            </span>
          </button>
        )}

        <AnimatePresence>
          {showSimulateButton && (
            <motion.button
              key="simulate-pipeline-btn"
              type="button"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              onClick={onToggleSimulation}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-[#D4D4D4] hover:text-white transition-colors cursor-pointer"
            >
              <Play className="size-3 fill-current text-[#A855F7]" />
              <span>Simulate Pipeline</span>
            </motion.button>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={onToggleHistory}
          aria-label="Conversation history"
          aria-expanded={isHistoryOpen}
          title="Conversation history"
          className={cn(
            'inline-flex items-center justify-center size-7 rounded-lg border transition-colors cursor-pointer',
            isHistoryOpen
              ? 'border-white/20 bg-white/10 text-white'
              : 'border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-[#A3A3A3] hover:text-white'
          )}
        >
          <History className="size-3.5" />
        </button>
      </div>
    </header>
  )
}
