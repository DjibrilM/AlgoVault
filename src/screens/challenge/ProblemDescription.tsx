import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bookmark,
  Share2,
  FileText,
  Lightbulb,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import { Problem, Difficulty } from './mockData'

interface ProblemDescriptionProps {
  problem: Problem
}

export function ProblemDescription({ problem }: ProblemDescriptionProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'solutions' | 'submissions'>('description')
  const [expandedHints, setExpandedHints] = useState<Record<number, boolean>>({})

  const toggleHint = (idx: number) => {
    setExpandedHints((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  const getDifficultyBadge = (diff: Difficulty) => {
    switch (diff) {
      case 'Easy':
        return 'text-[#16A34A] bg-[#16A34A]/20'
      case 'Medium':
        return 'text-[#F59E0B] bg-[#F59E0B]/20'
      case 'Hard':
        return 'text-[#DC2626] bg-[#DC2626]/20'
    }
  }

  const tabs = [
    {
      id: 'description' as const,
      label: 'Description',
      icon: FileText,
      iconColor: 'text-[#6366F1]',
    },
    {
      id: 'solutions' as const,
      label: 'Editorial & Solutions',
      icon: Lightbulb,
      iconColor: 'text-[#F59E0B]',
    },
    {
      id: 'submissions' as const,
      label: 'Submissions',
      icon: CheckCircle2,
      iconColor: 'text-[#16A34A]',
    },
  ]

  return (
    <div className="h-full flex flex-col bg-[#1A1A1A] text-[#E5E5E5] overflow-hidden select-text text-sm">
      {/* Pane Tabs Header with Framer Motion Sliding Tab Indicator */}
      <div className="h-10 border-b border-[#262626] px-3 flex items-center justify-between bg-[#171717] shrink-0 select-none">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isActive ? 'text-white' : 'text-[#A3A3A3] hover:text-white'
                }`}
              >
                {/* Sliding active tab pill */}
                {isActive && (
                  <motion.div
                    layoutId="problem-desc-active-tab-pill"
                    className="absolute inset-0 bg-white/5 rounded-md z-0"
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 35,
                    }}
                  />
                )}

                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon
                    className={`h-3.5 w-3.5 ${tab.iconColor} ${
                      isActive ? 'fill-current' : ''
                    }`}
                  />
                  <span>{tab.label}</span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-1 text-[#A3A3A3]">
          <button
            className="p-1 rounded hover:bg-[#262626] hover:text-white transition-colors cursor-pointer"
            title="Star problem"
          >
            <Bookmark className={`h-3.5 w-3.5 ${problem.starred ? 'text-[#F59E0B] fill-current' : ''}`} />
          </button>
          <button
            className="p-1 rounded hover:bg-[#262626] hover:text-white transition-colors cursor-pointer"
            title="Share"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Pane Content with Framer Motion Smooth Transition */}
      <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${problem.id}-${activeTab}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="space-y-6"
          >
            {activeTab === 'description' && (
              <>
                {/* Title & Metadata */}
                <div className="space-y-3 pb-3 border-b border-[#262626]">
                  <div className="flex items-center justify-between gap-4">
                    <h1 className="text-xl font-bold text-white tracking-tight">
                      {problem.id}. {problem.title}
                    </h1>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    {/* Difficulty Badge: Only Background, Zero Borders */}
                    <span
                      className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${getDifficultyBadge(
                        problem.difficulty
                      )}`}
                    >
                      {problem.difficulty}
                    </span>

                    <span className="text-[#A3A3A3] text-xs">
                      Acceptance: <strong className="text-white">{problem.acceptance}</strong>
                    </span>

                    <span className="text-[#525252]">•</span>

                    <span className="text-[#A3A3A3] text-xs">
                      Category: <strong className="text-white">{problem.category}</strong>
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {problem.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-[#262626] text-[#A3A3A3] border border-[#333333]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Problem Statement Body */}
                <div className="space-y-4 text-sm leading-relaxed text-[#D4D4D4]">
                  <p className="whitespace-pre-line">{problem.description}</p>
                </div>

                {/* Examples */}
                <div className="space-y-4 pt-2">
                  <h2 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider">
                    Examples
                  </h2>
                  {problem.examples.map((ex) => (
                    <div
                      key={ex.id}
                      className="rounded-xl border border-[#2E2E2E] bg-[#141414] p-3.5 space-y-2 text-xs font-mono"
                    >
                      <p className="text-[#A3A3A3] font-sans font-semibold">Example {ex.id}:</p>
                      <div className="space-y-1">
                        <p>
                          <span className="text-[#737373]">Input: </span>
                          <span className="text-white">{ex.input}</span>
                        </p>
                        <p>
                          <span className="text-[#737373]">Output: </span>
                          <span className="text-[#10B981]">{ex.output}</span>
                        </p>
                        {ex.explanation && (
                          <p className="pt-1 text-[#A3A3A3] font-sans text-xs">
                            <span className="text-[#737373] font-mono">Explanation: </span>
                            {ex.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Constraints */}
                <div className="space-y-2 pt-2">
                  <h2 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider">
                    Constraints
                  </h2>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs font-mono text-[#D4D4D4]">
                    {problem.constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>

                {/* Hints */}
                {problem.hints.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h2 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider">
                      Hints ({problem.hints.length})
                    </h2>
                    <div className="space-y-2">
                      {problem.hints.map((hint, idx) => {
                        const isOpen = Boolean(expandedHints[idx])
                        return (
                          <div
                            key={idx}
                            className="rounded-lg border border-[#2E2E2E] bg-[#141414] overflow-hidden"
                          >
                            <button
                              onClick={() => toggleHint(idx)}
                              className="w-full px-3 py-2 flex items-center justify-between text-xs text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <Lightbulb className="h-3.5 w-3.5 text-[#F59E0B]" />
                                <span className="font-semibold">Hint {idx + 1}</span>
                              </div>
                              {isOpen ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                            </button>
                            {isOpen && (
                              <div className="p-3 border-t border-[#262626] text-xs text-[#D4D4D4] bg-[#1A1A1A]">
                                {hint}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'solutions' && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-white">Optimal Approach</h2>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">
                  Hash Map One-Pass lookup allows matching complements in <code className="text-[#6366F1]">O(N)</code> time and <code className="text-[#6366F1]">O(N)</code> space.
                </p>
                <div className="p-4 rounded-xl border border-[#2E2E2E] bg-[#141414] space-y-2 text-xs">
                  <h3 className="font-semibold text-white">Complexity Analysis:</h3>
                  <ul className="list-disc pl-4 space-y-1 text-[#A3A3A3]">
                    <li><strong>Time Complexity:</strong> O(N) since we traverse the list containing N elements only once.</li>
                    <li><strong>Space Complexity:</strong> O(N) to store up to N elements in the hash table.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'submissions' && (
              <div className="space-y-3">
                <h2 className="text-base font-bold text-white">Recent Submissions</h2>
                <div className="rounded-xl border border-[#2E2E2E] bg-[#141414] p-3 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                    <span className="font-semibold text-[#16A34A]">Accepted</span>
                    <span className="text-[#737373]">•</span>
                    <span className="text-[#A3A3A3]">TypeScript</span>
                  </div>
                  <div className="flex items-center gap-3 text-mono text-[#A3A3A3]">
                    <span>Runtime: <strong className="text-white">48 ms</strong> (Beats 92%)</span>
                    <span>Memory: <strong className="text-white">44.8 MB</strong></span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
