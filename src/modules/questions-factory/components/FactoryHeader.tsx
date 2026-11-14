import { ArrowLeft, History, Play, Square } from 'lucide-react'
import type { AIAmplitude, AIState } from '@/components/ui/smoothui/ai-core'
import AIOrbFace from '@/components/ui/smoothui/ai-orb-face'
import { cn } from '@/lib/utils'

interface FactoryHeaderProps {
  orbState: AIState
  amplitude: AIAmplitude
  isSimulating: boolean
  isHistoryOpen: boolean
  onBackToHome: () => void
  onToggleSimulation: () => void
  onToggleHistory: () => void
}

/**
 * Top sub-header displaying back navigation, synchronized AI orb state,
 * pipeline simulation control, and the conversation history drawer trigger.
 */
export function FactoryHeader({
  orbState,
  amplitude,
  isSimulating,
  isHistoryOpen,
  onBackToHome,
  onToggleSimulation,
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
          <AIOrbFace
            amplitude={amplitude}
            aria-label={`Questions Factory is ${orbState}`}
            size={28}
            state={orbState}
          />
          <span className="text-xs font-semibold text-white">Questions Factory</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleSimulation}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-[#D4D4D4] hover:text-white transition-colors cursor-pointer"
        >
          {isSimulating ? (
            <>
              <Square className="size-3 fill-current text-[#F43F5E]" />
              <span>Stop Simulation</span>
            </>
          ) : (
            <>
              <Play className="size-3 fill-current text-[#A855F7]" />
              <span>Simulate Pipeline</span>
            </>
          )}
        </button>

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
