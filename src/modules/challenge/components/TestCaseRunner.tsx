import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  Terminal,
  Clock,
  Cpu,
  Layers,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TestCaseRunnerProps } from '../types'
import { Problem } from '@/shared/types/problem'

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
}: TestCaseRunnerProps) {
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<'testcase' | 'result'>('testcase')

  const currentCase = problem.testCases[selectedCaseIdx] || problem.testCases[0]

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
                  'fill-current text-[#16A34A]': activeTab === 'result',
                })}
              />
              <span>Console Output</span>
              {runResult.status === 'success' && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
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
        <div className="flex-1 overflow-y-auto p-4 text-xs font-mono select-text bg-[#1A1A1A]">
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
                    {problem.testCases.map((tc, idx) => {
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
              ) : (
                <div className="space-y-3">
                  {runResult.status === 'idle' && (
                    <div className="text-[#737373] py-4 text-center">
                      Run your code to view the live execution output and stdout diagnostics.
                    </div>
                  )}

                  {runResult.status === 'running' && (
                    <div className="flex items-center gap-2 text-[#6366F1] py-4 justify-center">
                      <div className="h-3.5 w-3.5 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
                      <span>Executing in isolated sandbox...</span>
                    </div>
                  )}

                  {runResult.status === 'success' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[#16A34A] font-semibold">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Execution Finished Successfully</span>
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
                      </div>

                      <div>
                        <div className="text-[10px] uppercase font-bold text-[#737373] mb-1">
                          Stdout / Output
                        </div>
                        <div className="p-2.5 rounded-lg bg-[#202020] border border-[#2E2E2E] text-white">
                          {runResult.output}
                        </div>
                      </div>
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
