import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  PanelLeftOpen,
} from 'lucide-react'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Problem } from './mockData'
import { ProblemDescription } from './ProblemDescription'
import { CodeEditor } from './CodeEditor'
import { TestCaseRunner } from './TestCaseRunner'

export interface ChallengeWorkspaceProps {
  problems: Problem[]
  selectedProblemId: number
  onSelectProblem: (id: number) => void
  onSolveProblem?: (problemId: number) => void
  isSidebarOpen?: boolean
  onToggleSidebar?: () => void
}

export function ChallengeWorkspace({
  problems,
  selectedProblemId,
  onSelectProblem,
  onSolveProblem,
  isSidebarOpen = true,
  onToggleSidebar,
}: ChallengeWorkspaceProps) {
  const [code, setCode] = useState<string>('')
  const [isRunning, setIsRunning] = useState(false)
  const [runResult, setRunResult] = useState<{
    status: 'idle' | 'running' | 'success' | 'error'
    runtime?: string
    memory?: string
    output?: string
  }>({ status: 'idle' })

  const currentProblem =
    problems.find((p) => p.id === selectedProblemId) || problems[0] || {
      id: 1,
      slug: 'sample',
      title: 'No problem selected',
      difficulty: 'Easy' as const,
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

  const handlePrevProblem = () => {
    const idx = problems.findIndex((p) => p.id === selectedProblemId)
    if (idx > 0) {
      onSelectProblem(problems[idx - 1].id)
      setRunResult({ status: 'idle' })
    }
  }

  const handleNextProblem = () => {
    const idx = problems.findIndex((p) => p.id === selectedProblemId)
    if (idx < problems.length - 1) {
      onSelectProblem(problems[idx + 1].id)
      setRunResult({ status: 'idle' })
    }
  }

  const handleRunCode = () => {
    setIsRunning(true)
    setRunResult({ status: 'running' })
    setTimeout(() => {
      setIsRunning(false)
      setRunResult({
        status: 'success',
        runtime: `${Math.floor(Math.random() * 20 + 35)} ms`,
        memory: `${(Math.random() * 2 + 42).toFixed(1)} MB`,
        output: currentProblem.testCases?.[0]?.expected || 'true',
      })
    }, 600)
  }

  const handleSubmitCode = () => {
    setIsRunning(true)
    setRunResult({ status: 'running' })
    setTimeout(() => {
      setIsRunning(false)
      setRunResult({
        status: 'success',
        runtime: `${Math.floor(Math.random() * 15 + 28)} ms`,
        memory: `${(Math.random() * 2 + 41).toFixed(1)} MB`,
        output: 'Accepted on 54 / 54 testcases',
      })

      onSolveProblem?.(selectedProblemId)
    }, 900)
  }

  return (
    <div className="h-full flex flex-col bg-[#141414] overflow-hidden">
      {/* Challenge Stage Header Bar (Static Structure) */}
      <div className="h-10 px-4 border-b border-[#262626] bg-[#171717] flex items-center justify-between select-none shrink-0 z-10">
        <div className="flex items-center gap-2">
          {!isSidebarOpen && onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 -ml-1 rounded-md text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Open challenges sidebar (⌘B)"
            >
              <PanelLeftOpen className="h-4 w-4 text-white" />
            </button>
          )}
          <span className="font-semibold text-xs text-[#A3A3A3]">Challenge:</span>
          {/* Only the title content crossfades */}
          <AnimatePresence mode="wait">
            <motion.span
              key={currentProblem.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="font-bold text-xs text-white"
            >
              {currentProblem.id}. {currentProblem.title}
            </motion.span>
          </AnimatePresence>
          {currentProblem.solved && (
            <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />
          )}
        </div>

        {/* Quick Problem Pagination */}
        <div className="flex items-center gap-1 text-[#A3A3A3]">
          <button
            onClick={handlePrevProblem}
            className="p-1.5 rounded hover:bg-[#262626] hover:text-white transition-colors cursor-pointer"
            title="Previous Problem"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleNextProblem}
            className="p-1.5 rounded hover:bg-[#262626] hover:text-white transition-colors cursor-pointer"
            title="Next Problem"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2-Column Split Workspace with Resizable Panels */}
      <ResizablePanelGroup
        orientation="horizontal"
        className="flex-1 h-full w-full overflow-hidden"
      >
        {/* Left Column: Problem Description & Editorial */}
        <ResizablePanel defaultSize="50%" minSize="25%">
          <ProblemDescription problem={currentProblem} />
        </ResizablePanel>

        <ResizableHandle />

        {/* Right Column: Code Editor + Testcase Runner */}
        <ResizablePanel defaultSize="50%" minSize="25%">
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize="65%" minSize="25%">
              <CodeEditor
                problem={currentProblem}
                code={code}
                onChangeCode={setCode}
                onRun={handleRunCode}
                onSubmit={handleSubmitCode}
                isRunning={isRunning}
              />
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel defaultSize="35%" minSize="15%">
              <TestCaseRunner
                problem={currentProblem}
                runResult={runResult}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default ChallengeWorkspace
