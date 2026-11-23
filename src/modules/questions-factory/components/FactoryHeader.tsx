import { type RefObject } from 'react'
import { ArrowLeft, History } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FactoryHeaderProps {
  orbSlotRef: RefObject<HTMLDivElement>
  isHistoryOpen: boolean
  onBackToHome: () => void
  onToggleHistory: () => void
}

/**
 * Top sub-header displaying back navigation, the anchored AI orb slot,
 * and history drawer trigger.
 */
export function FactoryHeader({
  orbSlotRef,
  isHistoryOpen,
  onBackToHome,
  onToggleHistory,
}: FactoryHeaderProps) {
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
