/**
 * @file agents/tools.ts
 * @description Direct domain tools owned by the Master Agent for shaping generation drafts
 * and persisting verified AI-generated challenges into SQLite.
 */

import { tool } from 'ai'
import { z } from 'zod'
import type {
  AiStreamEvent,
  DraftContentType,
  DraftDifficulty,
  DraftFieldKey,
  DraftQuestionStyle,
  GeneratedTargetDto,
  GenerationDraft,
} from '../../../../src/shared/types/ai.ts'
import type { CodeTestService } from '../../code-test/services/code-test.service.ts'
import type { ArchitectedChallengeSet } from '../types/index.ts'
import { auditArchitectedChallengeSet } from './challenge-verifier.agent.ts'

export function isDraftComplete(draft: GenerationDraft): boolean {
  return Boolean(
    draft.category &&
      draft.topic &&
      draft.contentType &&
      draft.difficulty &&
      draft.questionCount &&
      draft.questionStyle
  )
}

export function createEmptyDraft(): GenerationDraft {
  return {
    category: null,
    topic: null,
    contentType: null,
    difficulty: null,
    questionCount: null,
    questionStyle: null,
    readyToGenerate: false,
    generated: false,
  }
}

export function createUpdateDraftTool(params: {
  runId: string
  getDraft: () => GenerationDraft
  setDraft: (draft: GenerationDraft, updatedFields: DraftFieldKey[]) => void
  emitEvent: (event: AiStreamEvent) => void
}) {
  return tool({
    description:
      'Update fields on the active Questions Factory generation draft whenever the user specifies or changes topic, category, content type, difficulty, question count, or style.',
    inputSchema: z.object({
      category: z.string().nullable().optional(),
      topic: z.string().nullable().optional(),
      contentType: z
        .enum(['Practice Questions', 'Marathon Track', 'Category & Challenges'])
        .nullable()
        .optional(),
      difficulty: z
        .enum(['Easy', 'Medium', 'Hard', 'Progressive (Easy → Hard)'])
        .nullable()
        .optional(),
      questionCount: z.number().nullable().optional().describe('Integer between 1 and 15'),
      questionStyle: z
        .enum(['Implementation', 'Conceptual', 'Mixed'])
        .nullable()
        .optional(),
    }),
    contextSchema: z.object({
      runId: z.string(),
    }),
    execute: async (updates, { context }) => {
      const current = params.getDraft()
      const next: GenerationDraft = { ...current }
      const updatedFields: DraftFieldKey[] = []

      if (updates.category !== undefined && updates.category !== next.category) {
        next.category = updates.category
        updatedFields.push('category')
      }
      if (updates.topic !== undefined && updates.topic !== next.topic) {
        next.topic = updates.topic
        updatedFields.push('topic')
      }
      if (updates.contentType !== undefined && updates.contentType !== next.contentType) {
        next.contentType = updates.contentType as DraftContentType | null
        updatedFields.push('contentType')
      }
      if (updates.difficulty !== undefined && updates.difficulty !== next.difficulty) {
        next.difficulty = updates.difficulty as DraftDifficulty | null
        updatedFields.push('difficulty')
      }
      if (updates.questionCount !== undefined && updates.questionCount !== next.questionCount) {
        next.questionCount = updates.questionCount
        updatedFields.push('questionCount')
      }
      if (updates.questionStyle !== undefined && updates.questionStyle !== next.questionStyle) {
        next.questionStyle = updates.questionStyle as DraftQuestionStyle | null
        updatedFields.push('questionStyle')
      }

      next.readyToGenerate = isDraftComplete(next)
      params.setDraft(next, updatedFields)

      params.emitEvent({
        runId: context.runId,
        type: 'draft-updated',
        draft: next,
        updatedFields,
      })

      return {
        draft: next,
        updatedFields,
        missingFields: (
          [
            ['topic', next.topic],
            ['category', next.category],
            ['contentType', next.contentType],
            ['difficulty', next.difficulty],
            ['questionCount', next.questionCount],
            ['questionStyle', next.questionStyle],
          ] as Array<[DraftFieldKey, unknown]>
        )
          .filter(([, value]) => value === null || value === undefined || value === '')
          .map(([key]) => key),
      }
    },
  })
}

export function createSaveChallengeSetTool(params: {
  runId: string
  codeTestService: CodeTestService | null
  getDraft: () => GenerationDraft
  setDraft: (draft: GenerationDraft, updatedFields: DraftFieldKey[]) => void
  getBuiltSet: () => ArchitectedChallengeSet | null
  onSaved: (target: GeneratedTargetDto, challengeIds: number[]) => void
  emitEvent: (event: AiStreamEvent) => void
}) {
  return tool({
    description:
      'Persist the architected & verified challenge set into the local AlgoVault workspace database.',
    inputSchema: z.object({
      titleOverride: z.string().optional(),
    }),
    contextSchema: z.object({
      runId: z.string(),
      allowPersist: z.boolean().default(true),
    }),
    execute: async ({ titleOverride }, { context }) => {
      if (!context.allowPersist) {
        throw new Error('Persistence is disabled for this run.')
      }

      const builtSet = params.getBuiltSet()
      if (!builtSet) {
        throw new Error('No architected challenge set buffered to save.')
      }

      const audit = auditArchitectedChallengeSet(builtSet)
      if (!audit.valid) {
        throw new Error(
          `Cannot save challenge set because verification failed:\n- ${audit.issues.join('\n- ')}\nFix these issues with architectChallenges before saving.`
        )
      }

      const draft = params.getDraft()
      const topicTitle = titleOverride?.trim() || builtSet.categoryTitle || draft.topic || 'Custom Practice'
      const isMarathon = draft.contentType === 'Marathon Track'
      const targetTitle =
        isMarathon && !topicTitle.toLowerCase().includes('marathon')
          ? `${topicTitle} Marathon`
          : topicTitle

      params.emitEvent({
        runId: context.runId,
        type: 'agent-stage',
        agent: 'master',
        label: 'Almost there, wiring everything in...',
        detail: isMarathon
          ? `Saving ${builtSet.challenges.length} stages into ${targetTitle}`
          : `Saving ${builtSet.challenges.length} challenges into ${targetTitle}`,
        toolName: 'saveChallengeSet',
      })

      let resolvedName = targetTitle
      let reusedExisting = false
      let challengeIds: number[] = []

      if (params.codeTestService) {
        const dbResult = await params.codeTestService.createCategory({
          title: targetTitle,
          description: builtSet.categoryDescription,
          challenges: builtSet.challenges.map((ch) => ({
            title: ch.title,
            description: ch.description,
            difficulty: ch.difficulty,
            hints: ch.hints,
            tags: [
              topicTitle,
              ch.style,
              ...(ch.milestoneLabel?.trim() ? [`milestone:${ch.milestoneLabel.trim()}`] : []),
              ...(ch.isMilestoneCheckpoint ? ['milestone-checkpoint'] : []),
            ],
            examples: ch.examples.map((ex, idx) => ({
              id: idx + 1,
              input: ex.input,
              output: ex.output,
              ...(ex.explanation ? { explanation: ex.explanation } : {}),
            })),
            constraints: ch.constraints,
            initialSolutions: ch.initialSolutions,
            testCases: ch.testCases.map((tc, idx) => ({
              id: idx + 1,
              input: tc.input,
              expected: tc.expected,
              ...(tc.hidden ? { hidden: true } : {}),
            })),
          })),
        })

        resolvedName = dbResult?.category?.title ?? targetTitle
        reusedExisting = dbResult?.created === false
        if (dbResult && 'challenges' in dbResult && Array.isArray(dbResult.challenges)) {
          challengeIds = dbResult.challenges.map((item) => item.id)
        } else if (dbResult && 'challenge' in dbResult && dbResult.challenge) {
          challengeIds = [dbResult.challenge.id]
        }
      }

      const target: GeneratedTargetDto = {
        name: resolvedName,
        isMarathon,
      }

      const nextDraft: GenerationDraft = {
        ...draft,
        readyToGenerate: true,
        generated: true,
      }
      params.setDraft(nextDraft, [])
      params.emitEvent({
        runId: context.runId,
        type: 'draft-updated',
        draft: nextDraft,
        updatedFields: [],
      })
      params.onSaved(target, challengeIds)

      return {
        saved: true,
        categoryTitle: resolvedName,
        reusedExisting,
        isMarathon,
        count: builtSet.challenges.length,
        challengeIds,
      }
    },
  })
}
