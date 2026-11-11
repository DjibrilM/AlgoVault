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
import { Streamdown } from 'streamdown'
import { code } from '@streamdown/code'
import { mermaid } from '@streamdown/mermaid'
import { createMathPlugin } from '@streamdown/math'
import { cjk } from '@streamdown/cjk'
import 'katex/dist/katex.min.css'
import { cn } from '@/lib/utils'
import { Difficulty, Problem } from '@/shared/types/problem'
import { ProblemDescriptionProps } from '../types'
import { challengeService } from '../services/challengeService'

const math = createMathPlugin({ singleDollarTextMath: true })
const STREAMDOWN_PLUGINS = { code, mermaid, math, cjk }

const DEFAULT_PROBLEM: Problem = {
  id: 1,
  slug: 'sample',
  title: 'No problem selected',
  difficulty: 'Easy',
  category: 'General',
  acceptance: '50%',
  solved: false,
  starred: false,
  description: 'Select a problem from the sidebar.',
  examples: [],
  constraints: [],
  hints: [],
  tags: [],
  codeTemplates: { typescript: '', python: '', javascript: '', cpp: '' },
  testCases: [],
}

export function ProblemDescription({
  problem = DEFAULT_PROBLEM,
  headerActions,
  isStreaming = false,
}: ProblemDescriptionProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'solutions' | 'submissions'>('description')
  const [expandedHints, setExpandedHints] = useState<Record<number, boolean>>({})

  const toggleHint = (idx: number) => {
    setExpandedHints((prev) => ({ ...prev, [idx]: !prev[idx] }))
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
                className={cn(
                  'relative px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer',
                  {
                    'text-white': isActive,
                    'text-[#A3A3A3] hover:text-white': !isActive,
                  }
                )}
              >
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
                    className={cn('h-3.5 w-3.5', tab.iconColor, {
                      'fill-current': isActive,
                    })}
                  />
                  <span>{tab.label}</span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-1 text-[#A3A3A3]">
          {headerActions}
          <button
            className="p-1 rounded hover:bg-[#262626] hover:text-white transition-colors cursor-pointer"
            title="Star problem"
          >
            <Bookmark
              className={cn('h-3.5 w-3.5', {
                'text-[#F59E0B] fill-current': problem.starred,
              })}
            />
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
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-md font-semibold text-[11px]',
                        challengeService.getDifficultyBadge(problem.difficulty as Difficulty)
                      )}
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
                </div>

                {/* Problem Body */}
                <div className="text-xs text-[#D4D4D4] leading-relaxed font-normal">
                  <Streamdown
                    plugins={STREAMDOWN_PLUGINS}
                    isAnimating={isStreaming}
                    className="space-y-3 [&_code]:rounded [&_code]:bg-[#262626] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[11px] [&_code]:text-[#E5E5E5]"
                  >
                    {problem.description}
                  </Streamdown>
                </div>

                {/* Examples */}
                {problem.examples.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                      Examples
                    </h3>
                    <div className="space-y-3">
                      {problem.examples.map((ex) => (
                        <div
                          key={ex.id}
                          className="p-3.5 rounded-xl bg-[#202020] border border-[#2E2E2E] space-y-1.5 font-mono text-xs"
                        >
                          <div className="text-[#A3A3A3]">
                            <strong className="text-white font-semibold">Input:</strong> {ex.input}
                          </div>
                          <div className="text-[#A3A3A3]">
                            <strong className="text-white font-semibold">Output:</strong> {ex.output}
                          </div>
                          {ex.explanation && (
                            <div className="text-[#737373] text-[11px] font-sans pt-1">
                              <Streamdown
                                plugins={STREAMDOWN_PLUGINS}
                                isAnimating={isStreaming}
                              >
                                {`*Explanation:* ${ex.explanation}`}
                              </Streamdown>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Constraints */}
                {problem.constraints.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                      Constraints
                    </h3>
                    <ul className="list-disc list-inside space-y-1.5 text-xs text-[#A3A3A3]">
                      {problem.constraints.map((c, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#6366F1] select-none">•</span>
                          <Streamdown
                            plugins={STREAMDOWN_PLUGINS}
                            isAnimating={isStreaming}
                            className="text-[#D4D4D4] [&_p]:inline"
                          >
                            {c}
                          </Streamdown>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Hints Accordion */}
                {problem.hints.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                      Hints ({problem.hints.length})
                    </h3>
                    <div className="space-y-2">
                      {problem.hints.map((hint, idx) => {
                        const isOpen = Boolean(expandedHints[idx])
                        return (
                          <div
                            key={idx}
                            className="rounded-xl border border-[#2E2E2E] bg-[#202020] overflow-hidden text-xs"
                          >
                            <button
                              onClick={() => toggleHint(idx)}
                              className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-[#262626] transition-colors cursor-pointer"
                            >
                              <span className="font-medium text-[#D4D4D4] flex items-center gap-2">
                                <Lightbulb className="h-3.5 w-3.5 text-[#F59E0B]" />
                                <span>Hint {idx + 1}</span>
                              </span>
                              {isOpen ? (
                                <ChevronDown className="h-3.5 w-3.5 text-[#737373]" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-[#737373]" />
                              )}
                            </button>
                            {isOpen && (
                              <div className="p-3.5 pt-2 text-xs text-[#A3A3A3] border-t border-[#262626] bg-[#1A1A1A]">
                                <Streamdown
                                  plugins={STREAMDOWN_PLUGINS}
                                  isAnimating={isStreaming}
                                >
                                  {hint}
                                </Streamdown>
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
              <div className="space-y-4 text-xs text-[#D4D4D4]">
                <Streamdown
                  plugins={STREAMDOWN_PLUGINS}
                  isAnimating={isStreaming}
                  className="space-y-3"
                >
                  {`### Editorial & Official Solution\n\nDetailed time/space complexity analysis and step-by-step intuition for **${problem.title}**.\n\n\`\`\`typescript\n${problem.codeTemplates.typescript}\n\`\`\`\n\n- **Time Complexity:** $O(N)$\n- **Space Complexity:** $O(N)$ auxiliary space`}
                </Streamdown>
              </div>
            )}

            {activeTab === 'submissions' && (
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-white">Past Submissions</h3>
                <p className="text-xs text-[#A3A3A3]">
                  All recorded attempts and benchmarks for this challenge.
                </p>
                <div className="p-4 rounded-xl bg-[#202020] border border-[#2E2E2E] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                    <span className="text-white font-medium">Accepted</span>
                  </div>
                  <span className="text-[#737373] font-mono">35 ms • 42.1 MB</span>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ProblemDescription
