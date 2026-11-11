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
import { Problem } from './mockData'

interface TestCaseRunnerProps {
  problem: Problem
  runResult: {
    status: 'idle' | 'running' | 'success' | 'error'
    runtime?: string
    memory?: string
    output?: string
  }
}

export function TestCaseRunner({ problem, runResult }: TestCaseRunnerProps) {
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
            className={`relative px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'testcase' ? 'text-white' : 'text-[#A3A3A3] hover:text-white'
            }`}
          >
            {activeTab === 'testcase' && (
              <motion.div
                layoutId="test-runner-tab-pill"
                className="absolute inset-0 bg-white/5 rounded-md z-0"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Layers className={`h-3.5 w-3.5 ${activeTab === 'testcase' ? 'text-white' : ''}`} />
              <span>Testcases</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('result')}
            className={`relative px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'result' ? 'text-white' : 'text-[#A3A3A3] hover:text-white'
            }`}
          >
            {activeTab === 'result' && (
              <motion.div
                layoutId="test-runner-tab-pill"
                className="absolute inset-0 bg-white/5 rounded-md z-0"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Terminal className={`h-3.5 w-3.5 ${activeTab === 'result' ? 'fill-current text-[#16A34A]' : ''}`} />
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
                          className={`relative px-2.5 py-1 rounded-md text-xs font-sans font-medium transition-colors cursor-pointer ${
                            isSelectedCase ? 'text-white' : 'text-[#A3A3A3] hover:text-white'
                          }`}
                        >
                          {isSelectedCase && (
                            <motion.div
                              layoutId="test-case-case-pill"
                              className="absolute inset-0 bg-white/5 rounded-md z-0"
                              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                            />
                          )}
                          <span className="relative z-10">Case {idx + 1}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Input Display */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-sans font-semibold text-[#8C8C8C]">
                      Input:
                    </span>
                    <div className="p-2.5 rounded-lg bg-[#141414] border border-[#2E2E2E] text-[#D4D4D4] whitespace-pre-wrap">
                      {currentCase?.input}
                    </div>
                  </div>

                  {/* Expected Output */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-sans font-semibold text-[#8C8C8C]">
                      Expected Output:
                    </span>
                    <div className="p-2.5 rounded-lg bg-[#141414] border border-[#2E2E2E] text-[#10B981] whitespace-pre-wrap">
                      {currentCase?.expected}
                    </div>
                  </div>
                </div>
              ) : (
                /* Result Tab */
                <div className="space-y-3">
                  {runResult.status === 'idle' && (
                    <div className="text-center py-6 text-[#737373] font-sans">
                      Click <strong className="text-white">Run</strong> to execute your code against test cases.
                    </div>
                  )}

                  {runResult.status === 'running' && (
                    <div className="flex items-center justify-center gap-2 py-6 text-[#6366F1] font-sans">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#6366F1] border-t-transparent" />
                      <span>Executing code on runtime sandbox...</span>
                    </div>
                  )}

                  {runResult.status === 'success' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-[#2E2E2E] font-sans">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />
                          <span className="text-base font-bold text-[#16A34A]">Accepted</span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-[#A3A3A3]">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-[#10B981]" />
                            <span>Runtime: <strong className="text-white">{runResult.runtime || '4 ms'}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Cpu className="h-3.5 w-3.5 text-[#3B82F6]" />
                            <span>Memory: <strong className="text-white">{runResult.memory || '42.3 MB'}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-sans font-semibold text-[#8C8C8C]">
                          Result Output:
                        </span>
                        <div className="p-2.5 rounded-lg bg-[#141414] border border-[#2E2E2E] text-[#10B981]">
                          {runResult.output || currentCase?.expected}
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
