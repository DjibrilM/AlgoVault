import { useMemo } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Check, Code2, Flag, HelpCircle, Lock, Sparkles, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Problem } from '@/shared/types/problem'

interface MarathonQuestMapProps {
  title: string
  problems: Problem[]
  onSelectProblem: (problemId: number) => void
}

interface QuestStageData extends Record<string, unknown> {
  problem: Problem
  stageNumber: number
  milestoneLabel: string
  isSolved: boolean
  isLocked: boolean
  isActive: boolean
  onSelect: (problemId: number) => void
}

interface QuestMilestoneData extends Record<string, unknown> {
  isSolved: boolean
  stageNumber: number
}

interface QuestTeaserData extends Record<string, unknown> {
  variant: 'mystery' | 'spark'
}

type QuestStageNodeType = Node<QuestStageData, 'questStage'>
type QuestMilestoneNodeType = Node<QuestMilestoneData, 'questMilestone'>
type QuestTeaserNodeType = Node<QuestTeaserData, 'questTeaser'>
type QuestNodeType = QuestStageNodeType | QuestMilestoneNodeType | QuestTeaserNodeType

function QuestStageNode({ data }: NodeProps<QuestStageNodeType>) {
  const { problem, milestoneLabel, isSolved, isLocked, isActive, onSelect } = data

  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Top}
        className="!opacity-0 !pointer-events-none !w-2 !h-2"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!opacity-0 !pointer-events-none !w-2 !h-2"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!opacity-0 !pointer-events-none !w-2 !h-2"
      />

      <button
        type="button"
        disabled={isLocked}
        onClick={() => onSelect(problem.id)}
        className={cn(
          'w-[248px] h-[56px] rounded-full px-3 py-1.5 flex items-center gap-3 border transition-all duration-200 text-left',
          isSolved
            ? 'bg-[#122D1E] border-[#26a641]/65 text-white hover:bg-[#163825] cursor-pointer shadow-[0_6px_18px_rgba(0,0,0,0.45)]'
            : isActive
              ? 'bg-[#462123] border-[#A84447]/70 text-white hover:bg-[#532729] cursor-pointer shadow-[0_0_24px_rgba(168,68,71,0.28)]'
              : isLocked
                ? 'bg-[#212125] border-white/[0.06] text-[#8C8C8C] opacity-80 cursor-not-allowed'
                : 'bg-[#26262B] border-white/[0.1] text-[#E5E5E5] hover:bg-[#2E2E34] hover:border-white/25 cursor-pointer shadow-[0_6px_18px_rgba(0,0,0,0.45)]'
        )}
      >
        <span
          className={cn(
            'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
            isSolved
              ? 'bg-[#26a641] text-white'
              : isActive
                ? 'bg-[#8F3538] text-white'
                : isLocked
                  ? 'bg-[#2D2D33] border border-[#D97706]/40 text-[#F59E0B]'
                  : 'bg-[#3A3A42] text-[#D4D4D4]'
          )}
        >
          {isSolved ? (
            <Check className="h-4 w-4 stroke-[2.5]" />
          ) : isLocked ? (
            <Lock className="h-3.5 w-3.5" />
          ) : isActive ? (
            <Flag className="h-3.5 w-3.5" />
          ) : (
            <Code2 className="h-3.5 w-3.5" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold truncate leading-tight">
            {problem.title}
          </div>
          <div
            className={cn(
              'text-[10px] leading-tight mt-0.5',
              isSolved
                ? 'text-[#6EE7B7]'
                : isActive
                  ? 'text-[#FCA5A5]'
                  : isLocked
                    ? 'text-[#A16207]'
                    : 'text-[#8C8C8C]'
            )}
          >
            {milestoneLabel} · {problem.difficulty}
          </div>
        </div>
      </button>
    </div>
  )
}

function QuestMilestoneNode({ data }: NodeProps<QuestMilestoneNodeType>) {
  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Left}
        className="!opacity-0 !pointer-events-none !w-2 !h-2"
      />
      <div
        title={
          data.isSolved
            ? 'Milestone unlocked!'
            : `Complete Stage ${data.stageNumber} to unlock milestone`
        }
        className={cn(
          'h-10 w-10 rounded-xl border flex items-center justify-center transition-all',
          data.isSolved
            ? 'bg-[#33240C] border-[#F59E0B]/55 text-[#FBBF24] shadow-[0_0_16px_rgba(245,158,11,0.28)]'
            : 'bg-[#23201C] border-[#785322]/45 text-[#B47B34] opacity-90'
        )}
      >
        <Trophy className="h-4 w-4" />
      </div>
    </div>
  )
}

function QuestTeaserNode({ data }: NodeProps<QuestTeaserNodeType>) {
  const isMystery = data.variant === 'mystery'
  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Top}
        className="!opacity-0 !pointer-events-none !w-2 !h-2"
      />
      <div
        title={
          isMystery
            ? 'Future mastery stage'
            : 'Generate more stages in Questions Factory'
        }
        className={cn(
          'h-9 w-9 rounded-full bg-[#222228] border border-white/[0.08] flex items-center justify-center',
          isMystery ? 'text-[#A855F7]/75' : 'text-[#38BDF8]/75'
        )}
      >
        {isMystery ? (
          <HelpCircle className="h-4 w-4" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </div>
    </div>
  )
}

const NODE_TYPES = {
  questStage: QuestStageNode,
  questMilestone: QuestMilestoneNode,
  questTeaser: QuestTeaserNode,
}

const X_PATTERN = [0, -110, 0, 110]

/**
 * Interactive, pannable/zoomable @xyflow/react Marathon Quest map with bounded height,
 * connected milestone dots, dashed paths, and clickable stage nodes.
 */
export function MarathonQuestMap({
  title,
  problems,
  onSelectProblem,
}: MarathonQuestMapProps) {
  const solvedCount = problems.filter((p) => p.solved).length
  const totalCount = problems.length

  const firstUnsolvedIdx = useMemo(() => {
    const idx = problems.findIndex((p) => !p.solved)
    return idx === -1 ? Math.max(0, problems.length - 1) : idx
  }, [problems])

  const { nodes, edges } = useMemo(() => {
    const builtNodes: QuestNodeType[] = []
    const builtEdges: Edge[] = []

    const centerX = 320
    const rowGap = 118
    const hasExplicitCheckpoints = problems.some((p) =>
      p.tags.includes('milestone-checkpoint')
    )

    problems.forEach((prob, idx) => {
      const isSolved = prob.solved
      const isLocked = idx > 2 && !prob.solved && idx > firstUnsolvedIdx + 1
      const isActive = !isSolved && !isLocked && idx === firstUnsolvedIdx
      const milestoneTag = prob.tags.find((t) => t.startsWith('milestone:'))
      const milestoneLabel = milestoneTag
        ? milestoneTag.replace(/^milestone:/, '').trim()
        : `Stage ${idx + 1}`

      const x = centerX + X_PATTERN[idx % X_PATTERN.length]
      const y = idx * rowGap
      const nodeId = `stage-${prob.id}`

      builtNodes.push({
        id: nodeId,
        type: 'questStage',
        position: { x, y },
        draggable: false,
        selectable: false,
        data: {
          problem: prob,
          stageNumber: idx + 1,
          milestoneLabel,
          isSolved,
          isLocked,
          isActive,
          onSelect: onSelectProblem,
        },
      })

      if (idx > 0) {
        const prevProb = problems[idx - 1]
        builtEdges.push({
          id: `edge-${prevProb.id}-${prob.id}`,
          source: `stage-${prevProb.id}`,
          sourceHandle: 'bottom',
          target: nodeId,
          type: 'default',
          animated: true,
          style: {
            stroke: prevProb.solved ? '#26a641' : '#4A4A54',
            strokeWidth: 2,
            strokeDasharray: '6 5',
          },
        })
      }

      const hasRewardBranch = hasExplicitCheckpoints
        ? prob.tags.includes('milestone-checkpoint')
        : (idx > 0 && (idx + 1) % 4 === 0) || idx === problems.length - 1
      if (hasRewardBranch) {
        const rewardId = `milestone-${prob.id}`
        builtNodes.push({
          id: rewardId,
          type: 'questMilestone',
          position: { x: x + 306, y: y + 8 },
          draggable: false,
          selectable: false,
          data: {
            isSolved,
            stageNumber: idx + 1,
          },
        })
        builtEdges.push({
          id: `edge-reward-${prob.id}`,
          source: nodeId,
          sourceHandle: 'right',
          target: rewardId,
          type: 'straight',
          animated: true,
          style: {
            stroke: isSolved ? '#D97706' : '#4A4A54',
            strokeWidth: 2,
            strokeDasharray: '4 4',
          },
        })
      }
    })

    if (problems.length > 0) {
      const lastProb = problems[problems.length - 1]
      const lastX = centerX + X_PATTERN[(problems.length - 1) % X_PATTERN.length]
      const lastY = (problems.length - 1) * rowGap

      builtNodes.push(
        {
          id: 'teaser-mystery',
          type: 'questTeaser',
          position: { x: lastX + 46, y: lastY + 106 },
          draggable: false,
          selectable: false,
          data: { variant: 'mystery' },
        },
        {
          id: 'teaser-spark',
          type: 'questTeaser',
          position: { x: lastX + 146, y: lastY + 106 },
          draggable: false,
          selectable: false,
          data: { variant: 'spark' },
        }
      )

      builtEdges.push(
        {
          id: 'edge-teaser-mystery',
          source: `stage-${lastProb.id}`,
          sourceHandle: 'bottom',
          target: 'teaser-mystery',
          type: 'default',
          animated: true,
          style: { stroke: '#36363E', strokeWidth: 2, strokeDasharray: '4 4' },
        },
        {
          id: 'edge-teaser-spark',
          source: `stage-${lastProb.id}`,
          sourceHandle: 'bottom',
          target: 'teaser-spark',
          type: 'default',
          animated: true,
          style: { stroke: '#36363E', strokeWidth: 2, strokeDasharray: '4 4' },
        }
      )
    }

    return { nodes: builtNodes, edges: builtEdges }
  }, [firstUnsolvedIdx, onSelectProblem, problems])

  const allSolved = totalCount > 0 && solvedCount === totalCount

  return (
    <div className="w-full rounded-2xl border border-white/[0.06] bg-[#161618] overflow-hidden shadow-xl">
      {/* Quest Progress Header Bar */}
      <div className="px-5 py-3.5 border-b border-white/[0.06] bg-[#18181B] flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-white truncate">{title}</span>
          <span className="text-[11px] text-[#737373]">•</span>
          <span className="text-[11px] text-[#8C8C8C]">
            {allSolved ? 'Track Completed' : 'Drag to pan · Scroll to zoom'}
          </span>
        </div>

        {/* Connected Milestone Dots */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-mono font-semibold text-[#D4D4D4] tabular-nums">
            {solvedCount}/{totalCount}
          </span>
          <div className="flex items-center">
            {problems.slice(0, 12).map((prob, i) => {
              const isSolved = prob.solved
              const isActive = !isSolved && i === firstUnsolvedIdx
              return (
                <div key={prob.id} className="flex items-center">
                  <span
                    title={prob.title}
                    className={cn(
                      'h-2.5 w-2.5 rounded-full transition-colors',
                      isSolved
                        ? 'bg-[#39d353] shadow-[0_0_8px_rgba(57,211,83,0.45)]'
                        : isActive
                          ? 'bg-[#B44C4E] ring-2 ring-[#B44C4E]/40'
                          : 'bg-[#3A3A40]'
                    )}
                  />
                  {i < Math.min(problems.length, 12) - 1 && (
                    <span
                      className={cn(
                        'w-3 h-[2px]',
                        isSolved ? 'bg-[#26a641]' : 'bg-[#2E2E34]'
                      )}
                    />
                  )}
                </div>
              )
            })}
            {problems.length > 12 && (
              <span className="ml-1.5 text-[10px] text-[#737373]">
                +{problems.length - 12}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bounded Pannable/Zoomable React Flow Map Viewport */}
      <div
        className="w-full h-[540px] max-h-[560px] relative"
        style={{
          backgroundColor: '#161618',
          backgroundImage:
            'conic-gradient(#1A1A1E 90deg, #161618 90deg 180deg, #1A1A1E 180deg 270deg, #161618 270deg)',
          backgroundSize: '44px 44px',
        }}
      >
        {problems.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-[#737373]">
            No stages in this marathon yet.
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            fitView
            fitViewOptions={{ padding: 0.18, maxZoom: 1 }}
            minZoom={0.5}
            maxZoom={1.6}
            panOnDrag
            zoomOnScroll
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={22}
              size={1}
              color="rgba(255,255,255,0.06)"
            />
            <Controls
              showInteractive={false}
              className="!m-4 !bg-[#1C1C20] !border !border-white/[0.08] !rounded-lg !shadow-lg"
            />
            <MiniMap
              pannable
              zoomable
              nodeColor={(n) => {
                if (n.type === 'questMilestone') return '#D97706'
                if (n.type === 'questTeaser') return '#6B7280'
                const d = n.data as QuestStageData
                if (d?.isSolved) return '#26a641'
                if (d?.isActive) return '#A84447'
                return '#3A3A42'
              }}
              maskColor="rgba(16, 16, 18, 0.72)"
              className="!m-4 !bg-[#18181B] !border !border-white/[0.08] !rounded-xl"
            />
          </ReactFlow>
        )}
      </div>
    </div>
  )
}
