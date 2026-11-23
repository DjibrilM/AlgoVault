/**
 * @file agents/catalog-analyst.subagent.ts
 * @description Read-only subagent that explores AlgoVault's SQLite workspace catalog
 * via focused tools and summarizes existing categories & challenges back to the Master Agent.
 */

import {
  isStepCount,
  readUIMessageStream,
  tool,
  ToolLoopAgent,
  toUIMessageStream,
  type LanguageModel,
  type UIMessage,
} from 'ai'
import { z } from 'zod'
import type { CodeTestService } from '../../code-test/services/code-test.service.ts'
import type { AiStreamEvent } from '../../../../src/shared/types/ai.ts'

function extractLastText(message: UIMessage | undefined): string {
  if (!message) return ''
  for (let i = message.parts.length - 1; i >= 0; i -= 1) {
    const part = message.parts[i]
    if (part.type === 'text' && part.text.trim()) {
      return part.text
    }
  }
  return ''
}

export function createCatalogAnalystSubagent(
  model: LanguageModel,
  codeTestService: CodeTestService | null
) {
  return new ToolLoopAgent({
    model,
    instructions: `You are AlgoVault's Catalog Analyst subagent.
Explore the existing local workspace catalog autonomously before new problems are generated.

CRITICAL: End with a concise summary listing:
- Whether a matching category already exists (exact title if found)
- Up to 10 closely related existing problem titles so we avoid duplicates
- Recommended difficulty or subtopic gaps worth covering`,
    stopWhen: isStepCount(5),
    tools: {
      listCategories: tool({
        description: 'List all existing categories and challenge counts in the workspace.',
        inputSchema: z.object({}),
        execute: async () => {
          if (!codeTestService) {
            return { categories: [] as Array<{ title: string; count: number }> }
          }
          const data = await codeTestService.getWorkspaceData()
          return {
            categories: data.categories.map((cat) => ({
              title: cat.title,
              description: cat.description,
              count: cat.challenges?.length ?? 0,
            })),
          }
        },
      }),
      searchChallenges: tool({
        description: 'Search existing challenges by topic keyword, title, or tag.',
        inputSchema: z.object({
          query: z.string().describe('Topic keyword or phrase to search for'),
        }),
        execute: async ({ query }) => {
          if (!codeTestService) {
            return { matches: [] as Array<{ title: string; difficulty: string; category: string }> }
          }
          const q = query.trim().toLowerCase()
          const data = await codeTestService.getWorkspaceData()
          const matches = data.challenges
            .filter((ch) => {
              const title = ch.title.toLowerCase()
              const catTitle = ch.category?.title?.toLowerCase() ?? ''
              const tags = Array.isArray(ch.tags) ? ch.tags.join(' ').toLowerCase() : ''
              return !q || title.includes(q) || catTitle.includes(q) || tags.includes(q)
            })
            .slice(0, 15)
            .map((ch) => ({
              title: ch.title,
              difficulty: ch.difficulty,
              category: ch.category?.title ?? 'General',
            }))
          return { matches }
        },
      }),
    },
  })
}

export function createCatalogAnalystTool(params: {
  getModel: () => LanguageModel
  codeTestService: CodeTestService | null
  runId: string
  emitEvent: (event: AiStreamEvent) => void
}) {
  return tool({
    description:
      'Delegate workspace catalog inspection to the Catalog Analyst subagent to check existing categories and avoid duplicate challenges.',
    inputSchema: z.object({
      task: z.string().describe('Topic or question set goal to inspect against existing challenges'),
    }),
    execute: async function* ({ task }, { abortSignal }) {
      params.emitEvent({
        runId: params.runId,
        type: 'agent-stage',
        agent: 'catalog-analyst',
        label: 'Checking your existing library...',
        detail: 'Catalog subagent is scanning categories to avoid duplicates',
        toolName: 'consultCatalogAnalyst',
      })

      const subagent = createCatalogAnalystSubagent(params.getModel(), params.codeTestService)
      const result = await subagent.stream({
        prompt: task,
        abortSignal,
      })

      let latestMessage: UIMessage | undefined
      for await (const uiMessage of readUIMessageStream({
        stream: toUIMessageStream({ stream: result.stream }),
      })) {
        latestMessage = uiMessage
        yield uiMessage
      }

      if (!extractLastText(latestMessage)) {
        try {
          const text = await result.text
          if (text) {
            latestMessage = {
              id: `catalog-${Date.now()}`,
              role: 'assistant',
              parts: [{ type: 'text', text }],
            }
            yield latestMessage
          }
        } catch {
          // Ignore stream fallback errors when aborting
        }
      }

      return latestMessage
    },
    toModelOutput: ({ output }) => {
      const summary = extractLastText(output as UIMessage | undefined)
      return {
        type: 'text',
        value: summary || 'Catalog inspection completed.',
      }
    },
  })
}
