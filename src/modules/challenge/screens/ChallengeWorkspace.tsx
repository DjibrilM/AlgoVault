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
import { ChallengeWorkspaceProps } from '../types'
import { useChallengeWorkspace } from '../hooks/useChallengeWorkspace'
import { ProblemDescription } from '../components/ProblemDescription'
import { CodeEditor } from './CodeEditor'
import { TestCaseRunner } from '../components/TestCaseRunner'

export function ChallengeWorkspace({
  problems,
  selectedProblemId,
  onSelectProblem,
  onSolveProblem,
  isSidebarOpen = true,
  onToggleSidebar,
}: ChallengeWorkspaceProps) {
  const {
    code,
    setCode,
    selectedLang,
    setSelectedLang,
    isRunning,
    runResult,
    currentProblem,
    handlePrevProblem,
    handleNextProblem,
    handleRunCode,
    handleSubmitCode,
  } = useChallengeWorkspace({
    problems,
    selectedProblemId,
    onSelectProblem,
    onSolveProblem,
  })

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
                selectedLang={selectedLang}
                onSelectLang={setSelectedLang}
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
