import { useState } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  HardDrive,
  ChevronRight,
  ChevronDown,
  ExternalLink,
} from 'lucide-react'
import { problemsAtom, openChallengeAtom, activeNavAtom, activeCategoryAtom } from '@/shared/store'
import { CodeViewer } from '@/shared/components/CodeViewer'
import { useSubmissionsQuery } from '@/shared/hooks/useWorkspaceQueries'
import { cn } from '@/lib/utils'
import { HistoryScreenProps } from '../types'
import { useHistory } from '../hooks'

export function HistoryScreen({ onReturnHome }: HistoryScreenProps) {
  const { returnHome } = useHistory()
  const { data: submissions = [] } = useSubmissionsQuery()
  const problems = useAtomValue(problemsAtom)
  const openChallenge = useSetAtom(openChallengeAtom)
  const setActiveNav = useSetAtom(activeNavAtom)
  const setActiveCategory = useSetAtom(activeCategoryAtom)
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({})

  const handleBack = onReturnHome ?? returnHome

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleOpenSubmissionChallenge = (challengeId: number) => {
    const problem = problems.find((p) => p.id === challengeId)
    if (problem) {
      setActiveNav('home')
      setActiveCategory({ name: problem.category, isMarathon: false })
      openChallenge(problem.id)
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#1A1A1A] text-[#E5E5E5] overflow-y-auto select-none p-8 space-y-6 scrollbar-thin">
      <div className="max-w-4xl mx-auto w-full space-y-4">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs text-[#A3A3A3] hover:text-white transition-colors cursor-pointer py-1"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-white" />
          <span>Back to Home</span>
        </button>

        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#10B981]" />
            <span>Submissions History</span>
          </h1>
          <p className="text-xs text-[#8C8C8C]">
            Persisted submissions and compute resource metrics recorded in SQLite. Click any submission to inspect its code.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full space-y-2 pb-8">
        {submissions.length === 0 ? (
          <div className="p-8 rounded-2xl border border-white/6 bg-[#202020] text-center space-y-2">
            <p className="text-sm font-medium text-white">No submissions recorded yet</p>
            <p className="text-xs text-[#8C8C8C]">
              Solve and submit a challenge to inspect your verdicts, runtime, and memory metrics here.
            </p>
          </div>
        ) : (
          submissions.map((sub) => {
            const isAccepted = sub.verdict === 'Accepted'
            const isExpanded = Boolean(expandedIds[sub.id])
            const challengeTitle =
              sub.challenge?.title ||
              problems.find((p) => p.id === sub.challengeId)?.title ||
              `Challenge #${sub.challengeId}`

            return (
              <div
                key={sub.id}
                className="rounded-lg border border-white/4 hover:border-white/8 bg-[#202020] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(sub.id)}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-[#252525] transition-colors cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-[#8C8C8C] shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-[#8C8C8C] shrink-0" />
                    )}
                    {isAccepted ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A] shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-[#DC2626] shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-white truncate">
                      {challengeTitle}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0',
                        isAccepted
                          ? 'bg-[#16A34A]/15 text-[#16A34A]'
                          : 'bg-[#DC2626]/15 text-[#DC2626]'
                      )}
                    >
                      {sub.verdict}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-[#A3A3A3] shrink-0">
                      {sub.lang}
                    </span>
                    <span className="text-[11px] text-[#737373] shrink-0 hidden sm:inline">
                      {sub.passedCases}/{sub.totalCases} cases
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-mono text-[#8C8C8C] shrink-0">
                    <span className="flex items-center gap-1">
                      <Cpu className="h-3 w-3 text-[#737373]" />
                      {sub.timeMs}ms
                    </span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3 text-[#737373]" />
                      {(sub.memoryKb / 1024).toFixed(1)}MB
                    </span>
                    <span className="hidden md:inline text-[#666666]">
                      {new Date(sub.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-3.5 pb-3.5 pt-2.5 border-t border-white/[0.06] bg-[#181818] space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#8C8C8C]">
                        Submitted {new Date(sub.updatedAt).toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenSubmissionChallenge(sub.challengeId)}
                        className="inline-flex items-center gap-1 text-white/80 hover:text-white transition-colors cursor-pointer"
                      >
                        <span>Open Challenge</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>

                    <CodeViewer
                      code={sub.code}
                      lang={sub.lang}
                      className="prose prose-invert prose-xs max-w-none select-text [&>pre]:my-0"
                    />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default HistoryScreen
