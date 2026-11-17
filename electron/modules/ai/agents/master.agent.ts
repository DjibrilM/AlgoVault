/**
 * @file agents/master.agent.ts
 * @description Master ToolLoopAgent for AlgoVault Questions Factory.
 * Shapes generation drafts conversationally, delegates workspace exploration and challenge design
 * to specialized subagents, runs AST/completeness verification, and persists to SQLite.
 */

import { isStepCount, ToolLoopAgent, type LanguageModel } from 'ai'
import type {
  AiAgentRole,
  AiStreamEvent,
  DraftFieldKey,
  GeneratedQuestionItem,
  GeneratedTargetDto,
  GenerationDraft,
} from '../../../../src/shared/types/ai.ts'
import type { CodeTestService } from '../../code-test/services/code-test.service.ts'
import type { AgentRuntimeContext, ArchitectedChallengeSet } from '../types/index.ts'
import { createCatalogAnalystTool } from './catalog-analyst.subagent.ts'
import { createChallengeArchitectTool } from './challenge-architect.subagent.ts'
import { createVerifyChallengeSetTool } from './challenge-verifier.agent.ts'
import {
  createEmptyDraft,
  createSaveChallengeSetTool,
  createUpdateDraftTool,
} from './tools.ts'

export interface MasterAgentOrchestratorParams {
  runId: string
  model: LanguageModel
  codeTestService: CodeTestService | null
  initialDraft: GenerationDraft | null
  forceGenerate: boolean
  emitEvent: (event: AiStreamEvent) => void
}

export interface MasterAgentOrchestratorState {
  getDraft: () => GenerationDraft
  getUpdatedFields: () => DraftFieldKey[]
  getBuiltItems: () => GeneratedQuestionItem[] | undefined
  getSavedTarget: () => GeneratedTargetDto | null
  getChallengeIds: () => number[]
}

const TOOL_STAGE_LABELS: Record<
  string,
  { agent: AiAgentRole; label: string; detail: string }
> = {
  updateDraft: {
    agent: 'master',
    label: 'Shaping your generation draft...',
    detail: 'Updating topic, count, difficulty, and style preferences',
  },
  consultCatalogAnalyst: {
    agent: 'catalog-analyst',
    label: 'Checking your existing library...',
    detail: 'Catalog Analyst is scanning existing challenges',
  },
  invokeChallengeArchitect: {
    agent: 'challenge-architect',
    label: 'Crafting tailored challenges...',
    detail: 'Challenge Architect is designing problems and test cases',
  },
  verifyChallengeSet: {
    agent: 'challenge-verifier',
    label: 'Verifying templates and test cases...',
    detail: 'Checking TypeScript signatures and test completeness',
  },
  saveChallengeSet: {
    agent: 'master',
    label: 'Saving challenges to workspace...',
    detail: 'Writing new category and challenges into AlgoVault',
  },
}

/**
 * Instantiates the Master ToolLoopAgent along with a mutable state handle
 * collecting the updated draft, built preview items, and persisted target.
 */
export function createMasterAgent(params: MasterAgentOrchestratorParams): {
  agent: ReturnType<typeof buildAgent>
  state: MasterAgentOrchestratorState
} {
  let currentDraft: GenerationDraft = params.initialDraft
    ? { ...params.initialDraft }
    : createEmptyDraft()
  const updatedFieldSet = new Set<DraftFieldKey>()
  let builtSet: ArchitectedChallengeSet | null = null
  let builtItems: GeneratedQuestionItem[] | undefined
  let savedTarget: GeneratedTargetDto | null = null
  let savedChallengeIds: number[] = []

  const runtimeContext: AgentRuntimeContext = {
    runId: params.runId,
    forceGenerate: params.forceGenerate,
    phase: params.forceGenerate ? 'researching' : 'shaping',
    draft: currentDraft,
    hasBuiltSet: false,
    isVerified: false,
    savedTarget: null,
  }

  const updateDraftState = (next: GenerationDraft, fields: DraftFieldKey[]) => {
    currentDraft = next
    runtimeContext.draft = next
    for (const f of fields) {
      updatedFieldSet.add(f)
    }
  }

  const agent = buildAgent({
    params,
    runtimeContext,
    getDraft: () => currentDraft,
    setDraft: updateDraftState,
    getBuiltSet: () => builtSet,
    setBuiltSet: (set, items) => {
      builtSet = set
      builtItems = items
      runtimeContext.hasBuiltSet = true
      runtimeContext.isVerified = false
      runtimeContext.phase = 'verifying'
    },
    markVerified: (valid) => {
      runtimeContext.isVerified = valid
      if (valid) {
        runtimeContext.phase = 'persisting'
      }
    },
    onSaved: (target, challengeIds) => {
      savedTarget = target
      savedChallengeIds = challengeIds
      runtimeContext.savedTarget = target
      runtimeContext.phase = 'completed'
    },
  })

  return {
    agent,
    state: {
      getDraft: () => currentDraft,
      getUpdatedFields: () => Array.from(updatedFieldSet),
      getBuiltItems: () => builtItems,
      getSavedTarget: () => savedTarget,
      getChallengeIds: () => savedChallengeIds,
    },
  }
}

function buildAgent(ctx: {
  params: MasterAgentOrchestratorParams
  runtimeContext: AgentRuntimeContext
  getDraft: () => GenerationDraft
  setDraft: (draft: GenerationDraft, fields: DraftFieldKey[]) => void
  getBuiltSet: () => ArchitectedChallengeSet | null
  setBuiltSet: (set: ArchitectedChallengeSet, items: GeneratedQuestionItem[]) => void
  markVerified: (valid: boolean) => void
  onSaved: (target: GeneratedTargetDto, challengeIds: number[]) => void
}) {
  const { params } = ctx

  const updateDraft = createUpdateDraftTool({
    runId: params.runId,
    getDraft: ctx.getDraft,
    setDraft: ctx.setDraft,
    emitEvent: params.emitEvent,
  })

  const consultCatalogAnalyst = createCatalogAnalystTool({
    getModel: () => params.model,
    codeTestService: params.codeTestService,
    runId: params.runId,
    emitEvent: params.emitEvent,
  })

  const invokeChallengeArchitect = createChallengeArchitectTool({
    getModel: () => params.model,
    runId: params.runId,
    emitEvent: params.emitEvent,
    onBuilt: ctx.setBuiltSet,
  })

  const verifyChallengeSet = createVerifyChallengeSetTool({
    runId: params.runId,
    emitEvent: params.emitEvent,
    getBuiltSet: ctx.getBuiltSet,
    onVerified: (report) => ctx.markVerified(report.valid),
  })

  const saveChallengeSet = createSaveChallengeSetTool({
    runId: params.runId,
    codeTestService: params.codeTestService,
    getDraft: ctx.getDraft,
    setDraft: ctx.setDraft,
    getBuiltSet: ctx.getBuiltSet,
    onSaved: ctx.onSaved,
    emitEvent: params.emitEvent,
  })

  return new ToolLoopAgent({
    id: 'algovault-questions-factory-master',
    model: params.model,
    instructions: `You are AlgoVault's Questions Factory Master Agent — an intelligent curriculum & coding challenge companion.

Your job has two modes depending on conversation state:

1. DRAFT SHAPING (before generation is confirmed):
   - Extract or update draft specifications using \`updateDraft\` whenever the user expresses topic, category, content type (Practice Questions / Marathon Track / Category & Challenges), difficulty (Easy / Medium / Hard / Progressive (Easy → Hard)), questionCount (1–15), or questionStyle (Implementation / Conceptual / Mixed).
   - Pick sensible defaults for category ("Algorithms" or "Data Structures") and contentType ("Practice Questions") once a topic is clear unless the user specifies otherwise.
   - If any key draft fields are still missing (especially topic, questionCount, difficulty, questionStyle), ask ONE clear, friendly follow-up question in Markdown to collect the remaining details.
   - Once all 6 draft fields are ready AND the user has NOT yet confirmed generation, summarize the draft briefly and ask whether they want you to generate it now.

2. ORCHESTRATED GENERATION (when draft fields are complete AND the user confirms generation, OR explicitly asks to create immediately, OR forceGenerate is active):
   - Follow this exact multi-agent sequence:
     a) Call \`consultCatalogAnalyst\` to inspect existing workspace categories and challenge titles to avoid duplicates.
     b) Call \`invokeChallengeArchitect\` with the confirmed specification (and any \`avoidTitles\` found by Catalog Analyst) to design the full multi-language challenge set.
     c) Call \`verifyChallengeSet\` to validate starter templates and test completeness.
     d) Call \`saveChallengeSet\` to save the verified challenges into AlgoVault's workspace.
   - After saving, reply concisely confirming the saved category/track title and challenge count, and invite the user to click **Open Workspace** in the side panel. Never dump raw JSON or full starter code blobs in chat.`,
    tools: {
      updateDraft,
      consultCatalogAnalyst,
      invokeChallengeArchitect,
      verifyChallengeSet,
      saveChallengeSet,
    },
    runtimeContext: ctx.runtimeContext,
    toolsContext: {
      updateDraft: { runId: params.runId },
      saveChallengeSet: { runId: params.runId, allowPersist: true },
    },
    stopWhen: isStepCount(12),
    prepareStep: async ({ runtimeContext }) => {
      if (runtimeContext.phase === 'persisting' || runtimeContext.phase === 'verifying') {
        return { temperature: 0.2 }
      }
      return {}
    },
    onStart: () => {
      params.emitEvent({
        runId: params.runId,
        type: 'agent-stage',
        agent: 'master',
        label: params.forceGenerate
          ? `Let me prepare your ${ctx.getDraft().topic ?? 'Custom Practice'}...`
          : 'Reviewing your request...',
        detail: params.forceGenerate
          ? 'Orchestrating workspace check and challenge design'
          : 'Shaping draft specifications',
      })
    },
    onToolExecutionStart: ({ toolCall }) => {
      const stage = TOOL_STAGE_LABELS[toolCall.toolName]
      if (stage) {
        params.emitEvent({
          runId: params.runId,
          type: 'agent-stage',
          agent: stage.agent,
          label: stage.label,
          detail: stage.detail,
          toolName: toolCall.toolName,
        })
      }
    },
  })
}
