import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  XCircle,
  Terminal,
  Clock,
  Cpu,
  Layers,
  ChevronUp,
  ChevronDown,
  Brain,
  RotateCcw,
  Loader2,
} from 'lucide-react'
import { Streamdown } from 'streamdown'
import { code } from '@streamdown/code'
import { mermaid } from '@streamdown/mermaid'
import { createMathPlugin } from '@streamdown/math'
import { cjk } from '@streamdown/cjk'
import 'katex/dist/katex.min.css'
import AIReasoning from '@/components/ui/smoothui/ai-reasoning'
import { cn } from '@/lib/utils'
import { TestCaseRunnerProps } from '../types'
import { Problem } from '@/shared/types/problem'

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

export function TestCaseRunner({
  problem = DEFAULT_PROBLEM,
  runResult = { status: 'idle' },
  solutionFeedback = null,
  onRequestFeedbackRetry,
}: TestCaseRunnerProps) {
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<'testcase' | 'result' | 'feedback'>('testcase')

  // Filter for visible test cases in the case selector
  const visibleCases = (problem.testCases || []).filter((tc) => !tc.hidden)
  const displayCases = visibleCases.length > 0 ? visibleCases : (problem.testCases || [])
  const currentCase = displayCases[selectedCaseIdx] || displayCases[0]

  return (
    <div className="h-full flex flex-col bg-[#171717] overflow-hidden">
      {/* Test Runner Header with Framer Motion Tab Indicator */}
      <div className="h-10 px-3 border-b border-[#262626] flex items-center justify-between select-none shrink-0 bg-[#141414]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('testcase')}
            className={cn(
              'relative px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer',
              {
                'text-white': activeTab === 'testcase',
                'text-[#A3A3A3] hover:text-white': activeTab !== 'testcase',
              }
            )}
          >
            {activeTab === 'testcase' && (
              <motion.div
                layoutId="test-runner-tab-pill"
                className="absolute inset-0 bg-white/5 rounded-md z-0"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Layers
                className={cn('h-3.5 w-3.5', {
                  'text-white': activeTab === 'testcase',
                })}
              />
              <span>Testcases</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('result')}
            className={cn(
              'relative px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer',
              {
                'text-white': activeTab === 'result',
                'text-[#A3A3A3] hover:text-white': activeTab !== 'result',
              }
            )}
          >
            {activeTab === 'result' && (
              <motion.div
                layoutId="test-runner-tab-pill"
                className="absolute inset-0 bg-white/5 rounded-md z-0"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Terminal
                className={cn('h-3.5 w-3.5', {
                  'fill-current text-[#16A34A]': activeTab === 'result' && runResult.status !== 'error',
                  'text-[#EF4444]': activeTab === 'result' && runResult.status === 'error',
                })}
              />
              <span>Console Output</span>
              {runResult.status === 'success' && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
              )}
              {runResult.status === 'error' && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('feedback')}
            className={cn(
              'relative px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer',
              {
                'text-white': activeTab === 'feedback',
                'text-[#A3A3A3] hover:text-white': activeTab !== 'feedback',
              }
            )}
          >
            {activeTab === 'feedback' && (
              <motion.div
                layoutId="test-runner-tab-pill"
                className="absolute inset-0 bg-white/5 rounded-md z-0"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {solutionFeedback?.isStreaming ? (
                <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
              ) : (
                <Brain className="h-3.5 w-3.5 text-white" />
              )}
              <span>AI Feedback</span>
              {solutionFeedback?.text && !solutionFeedback.isStreaming && (
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </span>
          </button>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded text-[#A3A3A3] hover:text-white hover:bg-[#262626] transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
        >
          {isCollapsed ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Test Runner Body with Framer Motion Tab Crossfade */}
      {!isCollapsed && (
        <div
          className={cn(
            'flex-1 overflow-y-auto p-4 text-xs select-text bg-[#1A1A1A]',
            activeTab === 'feedback' ? 'font-sans' : 'font-mono'
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
            >
              {activeTab === 'testcase' ? (
                <div className="space-y-3">
                  {/* Case Selection Pills with animated active state */}
                  <div className="flex items-center gap-1.5 select-none">
                    {displayCases.map((tc, idx) => {
                      const isSelectedCase = selectedCaseIdx === idx
                      return (
                        <button
                          key={tc.id}
                          onClick={() => setSelectedCaseIdx(idx)}
                          className={cn(
                            'relative px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                            {
                              'text-white': isSelectedCase,
                              'text-[#737373] hover:text-white': !isSelectedCase,
                            }
                          )}
                        >
                          {isSelectedCase && (
                            <motion.div
                              layoutId="testcase-active-pill"
                              className="absolute inset-0 bg-[#262626] rounded-md z-0"
                              transition={{
                                type: 'spring',
                                stiffness: 500,
                                damping: 35,
                              }}
                            />
                          )}
                          <span className="relative z-10">Case {idx + 1}</span>
                        </button>
                      )
                    })}
                  </div>

                  {currentCase ? (
                    <div className="space-y-3 pt-1">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-[#737373] mb-1">
                          Input
                        </div>
                        <div className="p-2.5 rounded-lg bg-[#202020] border border-[#2E2E2E] text-white">
                          {currentCase.input}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase font-bold text-[#737373] mb-1">
                          Expected Output
                        </div>
                        <div className="p-2.5 rounded-lg bg-[#202020] border border-[#2E2E2E] text-[#10B981]">
                          {currentCase.expected}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[#737373] py-4">No test cases specified for this problem.</div>
                  )}
                </div>
              ) : activeTab === 'result' ? (
                <div className="space-y-3">
                  {runResult.status === 'idle' && (
                    <div className="text-[#737373] py-4 text-center">
                      Run your code to view the live execution output and stdout diagnostics.
                    </div>
                  )}

                  {runResult.status === 'running' && (
                    <div className="flex items-center gap-2 text-[#6366F1] py-4 justify-center">
                      <div className="h-3.5 w-3.5 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
                      <span>Executing in isolated sandbox micro-VM...</span>
                    </div>
                  )}

                  {runResult.status === 'success' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[#16A34A] font-semibold">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{runResult.verdict ? `${runResult.verdict} - All Tests Passed` : 'Execution Finished Successfully'}</span>
                      </div>

                      <div className="flex items-center gap-4 text-[11px] text-[#A3A3A3]">
                        {runResult.runtime && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-[#737373]" />
                            <span>Runtime: <strong className="text-white">{runResult.runtime}</strong></span>
                          </div>
                        )}
                        {runResult.memory && (
                          <div className="flex items-center gap-1">
                            <Cpu className="h-3 w-3 text-[#737373]" />
                            <span>Memory: <strong className="text-white">{runResult.memory}</strong></span>
                          </div>
                        )}
                        {runResult.totalCases && (
                          <div className="flex items-center gap-1 text-[#10B981]">
                            <span>Passed: <strong>{runResult.passedCases}/{runResult.totalCases}</strong></span>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-[10px] uppercase font-bold text-[#737373] mb-1">
                          Stdout / Output
                        </div>
                        <div className="p-2.5 rounded-lg bg-[#202020] border border-[#2E2E2E] text-white whitespace-pre-wrap font-mono">
                          {runResult.output}
                        </div>
                      </div>
                    </div>
                  )}

                  {runResult.status === 'error' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[#EF4444] font-semibold">
                        <XCircle className="h-4 w-4" />
                        <span>{runResult.verdict || 'Execution Error'}</span>
                      </div>

                      <div className="flex items-center gap-4 text-[11px] text-[#A3A3A3]">
                        {runResult.runtime && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-[#737373]" />
                            <span>Runtime: <strong className="text-white">{runResult.runtime}</strong></span>
                          </div>
                        )}
                        {runResult.memory && (
                          <div className="flex items-center gap-1">
                            <Cpu className="h-3 w-3 text-[#737373]" />
                            <span>Memory: <strong className="text-white">{runResult.memory}</strong></span>
                          </div>
                        )}
                        {runResult.failedCaseIndex && (
                          <div className="flex items-center gap-1 text-[#EF4444]">
                            <span>Failed on Case: <strong>#{runResult.failedCaseIndex}</strong></span>
                          </div>
                        )}
                      </div>

                      {runResult.expected && runResult.actual && (
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-[#10B981] mb-1">
                              Expected Output
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#202020] border border-[#10B981]/30 text-[#10B981] whitespace-pre-wrap font-mono">
                              {runResult.expected}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-[#EF4444] mb-1">
                              Your Output
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#202020] border border-[#EF4444]/30 text-[#EF4444] whitespace-pre-wrap font-mono">
                              {runResult.actual || '(empty)'}
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="text-[10px] uppercase font-bold text-[#737373] mb-1">
                          Diagnostic Details / Stderr
                        </div>
                        <div className="p-2.5 rounded-lg bg-[#202020] border border-[#EF4444]/30 text-[#FCA5A5] whitespace-pre-wrap font-mono">
                          {runResult.output}
                        </div>
                      </div>
                    </div>
                  )}

                  {solutionFeedback && (
                    <div className="font-sans rounded-xl bg-[#202020] px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {solutionFeedback.isStreaming ? (
                          <Loader2 className="h-3.5 w-3.5 text-white animate-spin shrink-0" />
                        ) : (
                          <Brain className="h-3.5 w-3.5 text-white shrink-0" />
                        )}
                        <span className="text-xs text-white truncate">
                          {solutionFeedback.isStreaming
                            ? 'Analyzing your submission…'
                            : 'AI Feedback ready'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('feedback')}
                        className="rounded-lg bg-white hover:bg-[#E5E5E5] px-3 py-1.5 text-[11px] font-semibold text-[#111111] transition-colors cursor-pointer shrink-0"
                      >
                        View Feedback
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 font-sans">
                  {!solutionFeedback ? (
                    <div className="rounded-2xl bg-[#202020] p-8 text-center space-y-2">
                      <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-white/[0.06] text-white mb-0.5">
                        <Brain className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-xs font-semibold text-white">
                        Solution Feedback
                      </p>
                      <p className="text-xs text-[#8C8C8C] max-w-sm mx-auto leading-relaxed">
                        Submit a solution to get feedback on your code.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/[0.06] flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-2 text-xs font-semibold text-white">
                            <Brain className="h-3.5 w-3.5 text-white" />
                            <span>Performance Coach</span>
                          </span>
                          <span className="rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-[#D4D4D4]">
                            {solutionFeedback.lang}
                          </span>
                          {solutionFeedback.verdict && (
                            <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] text-[#A3A3A3]">
                              {solutionFeedback.verdict}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {solutionFeedback.isStreaming && (
                            <span className="inline-flex items-center gap-1.5 text-[11px] text-[#D4D4D4]">
                              <Loader2 className="h-3 w-3 animate-spin text-white" />
                              <span>Analyzing…</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {solutionFeedback.error && !solutionFeedback.text ? (
                        <div className="rounded-xl bg-[#202020] p-4 text-xs text-rose-300 flex items-center justify-between gap-3">
                          <span>Could not generate feedback: {solutionFeedback.error}</span>
                          {onRequestFeedbackRetry && (
                            <button
                              type="button"
                              onClick={onRequestFeedbackRetry}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-white hover:bg-[#E5E5E5] px-3 py-1.5 text-[11px] font-semibold text-[#111111] transition-colors cursor-pointer shrink-0"
                            >
                              <RotateCcw className="h-3 w-3" />
                              <span>Retry</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {solutionFeedback.reasoning && (
                            <AIReasoning
                              collapseWhenDone
                              isStreaming={solutionFeedback.isStreaming}
                            >
                              <p>{solutionFeedback.reasoning}</p>
                            </AIReasoning>
                          )}

                          {solutionFeedback.text ? (
                            <Streamdown
                              plugins={STREAMDOWN_PLUGINS}
                              isAnimating={solutionFeedback.isStreaming}
                              className={cn(
                                'size-full space-y-3 text-xs leading-relaxed text-[#E5E5E5]',
                                '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
                                '[&_h1]:text-base [&_h1]:font-semibold [&_h1]:text-white [&_h1]:mt-3 [&_h1]:mb-1.5',
                                '[&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mt-3 [&_h2]:mb-1.5',
                                '[&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mt-2.5 [&_h3]:mb-1',
                                '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1',
                                '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1',
                                '[&_blockquote]:border-l-2 [&_blockquote]:border-white/20 [&_blockquote]:pl-3 [&_blockquote]:text-[#A3A3A3] [&_blockquote]:italic',
                                '[&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-[#262626] [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[11px] [&_:not(pre)>code]:text-white',
                                '[&_table]:w-full [&_table]:border-collapse [&_table]:text-[11px] [&_table]:my-2',
                                '[&_th]:border [&_th]:border-white/10 [&_th]:bg-white/[0.04] [&_th]:px-2.5 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold [&_th]:text-white',
                                '[&_td]:border [&_td]:border-white/10 [&_td]:px-2.5 [&_td]:py-1 [&_td]:text-[#D4D4D4]',
                                '[&_.katex-display]:overflow-x-auto [&_.katex-display]:py-1.5'
                              )}
                            >
                              {solutionFeedback.text}
                            </Streamdown>
                          ) : (
                            <span className="text-xs text-[#737373] italic">
                              Evaluating complexity &amp; optimization paths…
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

export default TestCaseRunner
