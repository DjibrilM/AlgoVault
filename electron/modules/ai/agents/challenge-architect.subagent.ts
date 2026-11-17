/**
 * @file agents/challenge-architect.subagent.ts
 * @description Specialized subagent using ToolLoopAgent + Output.object to architect
 * complete multi-language AlgoVault challenges (starter templates, examples, hints, test cases).
 */

import {
  isStepCount,
  Output,
  tool,
  ToolLoopAgent,
  type LanguageModel,
} from 'ai'
import { z } from 'zod'
import type {
  AiStreamEvent,
  DraftContentType,
  DraftDifficulty,
  DraftQuestionStyle,
  GeneratedQuestionItem,
} from '../../../../src/shared/types/ai.ts'
import {
  ArchitectedChallengeSetSchema,
  type ArchitectedChallengeSet,
} from '../types/index.ts'

export function createChallengeArchitectSubagent(model: LanguageModel) {
  return new ToolLoopAgent({
    model,
    instructions: `You are AlgoVault's Challenge Architect subagent.
Design self-contained algorithmic & technical practice problems ready to execute in AlgoVault's workspace.

Requirements for EVERY challenge:
1. "description": Clear Markdown with problem statement, **Input/Output** expectations, and concise intuition/math in KaTeX ($...$ or $$...$$) where helpful.
2. "examples": At least 1 clear example matching exact parameter formats (e.g. input: "nums = [1, 2, 3], k = 2", output: "3").
3. "constraints": Realistic algorithmic constraints in clean Markdown/KaTeX (e.g. "$1 \\le n \\le 10^5$").
4. "hints": 2–3 helpful, progressive hints without giving away the full code.
5. "initialSolutions": Pure LeetCode-style starter function signatures ONLY — NO stdin/stdout boilerplate (no readFileSync, input(), cin/cout, or int main).
   - Provide clean, syntactically valid stubs in all 4 keys: typescript, javascript, python, cpp.
   - Use consistent parameter names & return types across languages matching "examples" and "testCases".
6. "testCases": At least 2 concrete deterministic test cases with "input" (e.g. "nums = [1, 2, 3], k = 2") and exact serialized "expected" (e.g. "3" or "[0, 1]" or "true"). Include at least one hidden edge case with hidden: true when creating 3+ tests.
7. Strictly respect the requested count, topic, difficulty distribution (for Progressive: ramp smoothly Easy -> Medium -> Hard), and questionStyle.`,
    output: Output.object({
      schema: ArchitectedChallengeSetSchema,
    }),
    stopWhen: isStepCount(6),
  })
}

export function mapChallengeSetToPreviewItems(
  set: ArchitectedChallengeSet
): GeneratedQuestionItem[] {
  return set.challenges.map((ch, idx) => ({
    id: `gen-${Date.now()}-${idx}`,
    index: idx + 1,
    title: ch.title,
    difficulty: ch.difficulty,
    style: ch.style,
    description: ch.description,
  }))
}

export function createChallengeArchitectTool(params: {
  getModel: () => LanguageModel
  runId: string
  emitEvent: (event: AiStreamEvent) => void
  onBuilt: (set: ArchitectedChallengeSet, items: GeneratedQuestionItem[]) => void
}) {
  return tool({
    description:
      'Delegate challenge generation to the Challenge Architect subagent to produce complete multi-language problems, examples, hints, constraints, and test cases.',
    inputSchema: z.object({
      topic: z.string(),
      category: z.string().default('Algorithms'),
      contentType: z
        .enum(['Practice Questions', 'Marathon Track', 'Category & Challenges'])
        .default('Practice Questions'),
      difficulty: z
        .enum(['Easy', 'Medium', 'Hard', 'Progressive (Easy → Hard)'])
        .default('Medium'),
      questionCount: z.number().int().min(1).max(15).default(3),
      questionStyle: z
        .enum(['Implementation', 'Conceptual', 'Mixed'])
        .default('Implementation'),
      avoidTitles: z
        .array(z.string())
        .optional()
        .describe('Existing challenge titles from Catalog Analyst to avoid duplicating'),
      focusNotes: z
        .string()
        .optional()
        .describe('Additional nuance requested by the user'),
    }),
    execute: async (input, { abortSignal }) => {
      const styleLabel = (input.questionStyle as DraftQuestionStyle).toLowerCase()
      const isMarathon = (input.contentType as DraftContentType) === 'Marathon Track'

      params.emitEvent({
        runId: params.runId,
        type: 'agent-stage',
        agent: 'challenge-architect',
        label: isMarathon
          ? `Let me weave ${input.questionCount} ${input.topic} stages...`
          : `Let me craft ${input.questionCount} ${styleLabel} ${input.topic} problems...`,
        detail: `Challenge Architect is building starter templates, hints, and test suites`,
        toolName: 'invokeChallengeArchitect',
      })

      const architect = createChallengeArchitectSubagent(params.getModel())
      const avoidLine =
        input.avoidTitles && input.avoidTitles.length > 0
          ? `\nAvoid duplicating these existing challenges: ${input.avoidTitles.join(', ')}.`
          : ''
      const notesLine = input.focusNotes ? `\nAdditional user guidance: ${input.focusNotes}` : ''

      const prompt = `Generate exactly ${input.questionCount} unique ${input.difficulty as DraftDifficulty} ${input.questionStyle} challenge(s) for topic "${input.topic}" under category "${input.category}" (format: ${input.contentType}).${avoidLine}${notesLine}`

      const result = await architect.generate({
        prompt,
        abortSignal,
      })

      const structured = result.output
      const items = mapChallengeSetToPreviewItems(structured)
      params.onBuilt(structured, items)

      return {
        categoryTitle: structured.categoryTitle,
        count: items.length,
        titles: items.map((item) => `${item.index}. ${item.title} (${item.difficulty}, ${item.style})`),
      }
    },
    // Keep full code templates & descriptions out of the Master Agent's context window
    toModelOutput: ({ output }) => ({
      type: 'text',
      value: `Architected ${output.count} challenges in "${output.categoryTitle}": ${output.titles.join('; ')}. Full starter templates and test cases are buffered and ready for verification & saving.`,
    }),
  })
}

