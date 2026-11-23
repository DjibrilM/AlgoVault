import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import type {
  DraftFieldKey,
  GeneratedQuestionItem,
  GenerationDraft,
} from '../utils/draftEngine'
import { cn } from '@/lib/utils'

interface GenerationDraftPanelProps {
  draft: GenerationDraft | null
  highlightedFields: DraftFieldKey[]
  isGenerating: boolean
  isOutputRevealed: boolean
  generatedQuestions: GeneratedQuestionItem[]
  onOpenWorkspace: () => void
}

interface DraftRowConfig {
  key: DraftFieldKey
  label: string
  value: string | null
}

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const

export function GenerationDraftPanel({
  draft,
  highlightedFields,
  isGenerating,
  isOutputRevealed,
  generatedQuestions,
  onOpenWorkspace,
}: GenerationDraftPanelProps) {
  const isRevealed = Boolean(draft?.generated && isOutputRevealed)
  const [isOverviewOpen, setIsOverviewOpen] = useState(!isRevealed)

  // Collapse the overview into a tidy accordion once generated output is revealed
  useEffect(() => {
    setIsOverviewOpen(!isRevealed)
  }, [isRevealed])

  const rows: DraftRowConfig[] = draft
    ? [
        { key: 'category', label: 'Category', value: draft.category },
        { key: 'topic', label: 'Topic', value: draft.topic },
        { key: 'contentType', label: 'Content', value: draft.contentType },
        { key: 'difficulty', label: 'Difficulty', value: draft.difficulty },
        {
          key: 'questionCount',
          label: 'Questions',
          value: draft.questionCount ? `${draft.questionCount}` : null,
        },
        { key: 'questionStyle', label: 'Style', value: draft.questionStyle },
      ]
    : []

  const renderOverviewRows = () => (
    <div className="space-y-4">
      {rows.map((row) => {
        const isConfirmed = row.value !== null
        const isHighlighted = highlightedFields.includes(row.key)

        return (
          <motion.div
            key={row.key}
            layout
            animate={{
              backgroundColor: isHighlighted
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(255, 255, 255, 0)',
            }}
            transition={{ duration: 0.28 }}
            className="flex items-center justify-between gap-4 px-2.5 py-2 -mx-2.5 rounded-md"
          >
            <span className="text-xs text-[#737373] shrink-0">
              {row.label}
            </span>

            <AnimatePresence mode="wait">
              <motion.span
                key={row.value ?? 'tbd'}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.18 }}
                className={cn(
                  'text-xs text-right truncate',
                  isConfirmed
                    ? 'text-[#E5E5E5] font-medium'
                    : 'text-[#525252] italic'
                )}
              >
                {row.value ?? 'To be determined'}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )

  return (
    <AnimatePresence>
      {draft && (
        <motion.aside
          key="generation-draft-panel"
          initial={{ opacity: 0, x: 24, width: 0 }}
          animate={{ opacity: 1, x: 0, width: 340 }}
          exit={{ opacity: 0, x: 24, width: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="h-full shrink-0 border-l border-white/[0.06] bg-[#161616] overflow-hidden flex flex-col"
        >
          <div className="w-[340px] h-full flex flex-col">
            {/* Header */}
            <div className="px-5 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-xs font-medium text-[#E5E5E5]">
                {isRevealed ? 'Generated Output' : 'Generation Draft'}
              </span>
              <span className="text-[11px] text-[#737373]">
                {isGenerating
                  ? 'Generating...'
                  : isRevealed
                    ? 'Generated'
                    : draft.readyToGenerate
                      ? 'Awaiting confirmation'
                      : 'Drafting'}
              </span>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <AnimatePresence mode="wait" initial={false}>
                {!isRevealed ? (
                  <motion.div
                    key="draft-overview-rows"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16, ease: EASE_OUT_EXPO }}
                  >
                    {renderOverviewRows()}
                  </motion.div>
                ) : (
                  <motion.div key="generated-output-content" className="space-y-6">
                    {/* Collapsible Overview Accordion */}
                    <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.36, delay: 0.04, ease: EASE_OUT_EXPO }}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5"
                    >
                      <button
                        type="button"
                        onClick={() => setIsOverviewOpen((prev) => !prev)}
                        className="w-full flex items-center justify-between gap-2 py-1 text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-medium text-[#E5E5E5]">
                            Overview
                          </span>
                          <span className="text-[11px] text-[#737373] truncate">
                            {draft.topic} · {generatedQuestions.length} items
                          </span>
                        </div>
                        <motion.span
                          animate={{ rotate: isOverviewOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-[#737373] group-hover:text-white shrink-0"
                        >
                          <ChevronDown className="size-3.5" />
                        </motion.span>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOverviewOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
                            className="overflow-hidden"
                          >
                            <div className="pt-4 pb-2">{renderOverviewRows()}</div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Animated List of All Generated Questions */}
                    <div className="space-y-3">
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.28, delay: 0.12, ease: EASE_OUT_EXPO }}
                        className="flex items-center justify-between"
                      >
                        <span className="text-xs font-medium text-[#A3A3A3]">
                          Generated Questions
                        </span>
                        <span className="text-[11px] tabular-nums text-[#737373]">
                          {generatedQuestions.length}
                        </span>
                      </motion.div>

                      <div className="space-y-2.5">
                        {generatedQuestions.map((q, idx) => (
                          <motion.div
                            key={q.id}
                            initial={{ opacity: 0, y: 14, scale: 0.975 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{
                              duration: 0.34,
                              delay: 0.18 + idx * 0.08,
                              ease: EASE_OUT_EXPO,
                            }}
                            className="rounded-xl bg-white/[0.03] px-3.5 py-3 space-y-1.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-medium text-[#E5E5E5] leading-snug">
                                <span className="text-[#666666] mr-2 tabular-nums">
                                  {String(q.index).padStart(2, '0')}
                                </span>
                                {q.title}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-[#737373] pl-6">
                              <span>{q.style}</span>
                              <span>{q.difficulty}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* White Action Button (only after generated output is revealed) */}
            <AnimatePresence>
              {isRevealed && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{
                    duration: 0.28,
                    delay: 0.2 + generatedQuestions.length * 0.08,
                    ease: EASE_OUT_EXPO,
                  }}
                  className="p-4 border-t border-white/[0.06]"
                >
                  <button
                    type="button"
                    onClick={onOpenWorkspace}
                    className="w-full h-9 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium transition-colors cursor-pointer"
                  >
                    Open Workspace
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
