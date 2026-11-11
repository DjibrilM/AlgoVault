import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Circle,
  Lock,
  PanelLeftClose,
} from 'lucide-react'
import { Problem, Difficulty } from './mockData'

interface ChallengeSidebarProps {
  categoryTitle: string
  problems: Problem[]
  selectedProblemId: number
  onSelectProblem: (id: number) => void
  onBackToHome?: () => void
  onClose?: () => void
  isMarathon?: boolean
}

export function ChallengeSidebar({
  categoryTitle,
  problems,
  selectedProblemId,
  onSelectProblem,
  onClose,
  isMarathon = false,
}: ChallengeSidebarProps) {
  // Difficulty badge styling
  const getDifficultyBadge = (diff: Difficulty) => {
    switch (diff) {
      case 'Easy':
        return 'bg-[#16A34A]/20 text-[#16A34A]'
      case 'Medium':
        return 'bg-[#F59E0B]/20 text-[#F59E0B]'
      case 'Hard':
        return 'bg-[#DC2626]/20 text-[#DC2626]'
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#181818] text-[#D4D4D4] select-none text-xs">
      {/* Category Header */}
      <div className="h-10 border-b border-[#262626] px-3 flex items-center justify-between shrink-0 bg-[#181818]">
        <div className="min-w-0 flex flex-col justify-center ml-1">
          <h2 className="font-bold text-xs text-white truncate leading-tight">
            {categoryTitle}
          </h2>
          <p className="text-[10px] text-[#737373] leading-none mt-1">
            {problems.length} challenges
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Close sidebar (⌘B)"
          >
            <PanelLeftClose className="h-4 w-4 text-white" />
          </button>
        )}
      </div>

      {/* Scrollable Questions List with Framer Motion Sliding Active Indicator */}
      <div className="relative flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin">
        {problems.length === 0 ? (
          <div className="py-8 text-center text-[#737373]">
            No challenges available
          </div>
        ) : (
          problems.map((prob, idx) => {
            const isSelected = prob.id === selectedProblemId
            const isLocked = isMarathon && idx > 2 && !prob.solved

            return (
              <button
                key={prob.id}
                disabled={isLocked}
                onClick={() => onSelectProblem(prob.id)}
                className={`relative w-full px-2.5 py-2 rounded-md flex items-center justify-between text-left cursor-pointer transition-colors ${
                  isLocked
                    ? 'opacity-40 cursor-not-allowed text-[#737373]'
                    : isSelected
                    ? 'text-white'
                    : 'text-[#D4D4D4] hover:bg-[#222222]/70 hover:text-white'
                }`}
              >
                {/* Framer Motion Animated Sliding Active Indicator Pill */}
                {isSelected && (
                  <motion.div
                    layoutId="challenge-sidebar-active-pill"
                    className="absolute inset-0 rounded-md bg-white/5 z-0"
                    transition={{
                      type: 'spring',
                      stiffness: 450,
                      damping: 35,
                    }}
                  />
                )}

                {/* Left Content (Title & Status) */}
                <div className="relative z-10 flex items-center gap-2 min-w-0 flex-1">
                  {prob.solved ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#16A34A]" />
                  ) : isLocked ? (
                    <Lock className="h-3.5 w-3.5 shrink-0 text-[#737373]" />
                  ) : (
                    <Circle
                      className={`h-3 w-3 shrink-0 ${
                        isSelected ? 'text-white/70' : 'text-[#525252]'
                      }`}
                    />
                  )}

                  {/* Strictly constant font size & weight to prevent jitter */}
                  <span className="truncate text-xs font-normal">
                    {prob.title}
                  </span>
                </div>

                {/* Difficulty Badge */}
                <span
                  className={`relative z-10 text-[9px] font-normal px-1.5 py-0.5 rounded shrink-0 ml-1.5 transition-colors ${getDifficultyBadge(
                    prob.difficulty
                  )}`}
                >
                  {prob.difficulty}
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

export default ChallengeSidebar
