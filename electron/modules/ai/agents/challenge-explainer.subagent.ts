/**
 * @file agents/challenge-explainer.subagent.ts
 * @description Conversational tutor agent embedded inside the Challenge Problem Description pane
 * that clarifies ambiguous problem statements, walks through examples, and visualizes edge cases.
 */

import { isStepCount, ToolLoopAgent, type LanguageModel, type ModelMessage } from 'ai'
import type {
  ChallengeChatRequestDto,
  ChallengeContextDto,
} from '../../../../src/shared/types/ai.ts'

export function createChallengeExplainerAgent(
  model: LanguageModel,
  problem: ChallengeContextDto,
  currentLang?: string,
  currentCode?: string
) {
  const examplesBlock =
    problem.examples.length > 0
      ? problem.examples
          .map(
            (ex, idx) =>
              `${idx + 1}. Input: \`${ex.input}\` → Output: \`${ex.output}\`${
                ex.explanation ? ` (${ex.explanation})` : ''
              }`
          )
          .join('\n')
      : 'None listed.'

  const constraintsBlock =
    problem.constraints.length > 0
      ? problem.constraints.map((c) => `- ${c}`).join('\n')
      : '- Standard constraints'

  const hintsBlock =
    problem.hints && problem.hints.length > 0
      ? problem.hints.map((h, i) => `${i + 1}. ${h}`).join('\n')
      : 'None'

  const codeContext =
    currentCode && currentCode.trim()
      ? `\nUser's current editor code (${currentLang ?? 'typescript'}):\n\`\`\`${currentLang ?? 'typescript'}\n${currentCode}\n\`\`\``
      : ''

  return new ToolLoopAgent({
    id: 'algovault-challenge-explainer',
    model,
    instructions: `You are AlgoVault's Challenge Explainer & Tutor inside the challenge workspace.
Your purpose is to help the user understand the active coding challenge in a natural, conversational way.

Guidelines:
1. Match the user's energy and intent:
   - If the user sends a casual greeting (like "hey", "hi", "hello") or a brief check-in, reply warmly in 1-2 short sentences and ask how they'd like to start (e.g., an example walkthrough, intuition, or checking their code). Do NOT dump an unrequested lecture, headings, or diagrams.
   - Keep replies concise and human — answer what was asked without over-explaining.
2. Ground technical explanations directly in this challenge's exact problem statement, examples, and constraints.
3. Only use KaTeX math ($...$ / $$...$$), concise Mermaid diagrams (\`flowchart LR\` or \`graph TD\`, quoting node labels that contain parentheses/brackets), or step-by-step dry runs when they genuinely clarify a concept the user asked about.
4. Keep the user in the driver's seat: guide them toward the right mental model and invariants without dumping the complete final solution unless they explicitly ask for it.

### Active Challenge Context
- **Title**: ${problem.id}. ${problem.title} (${problem.difficulty} · ${problem.category})
- **Description**:
${problem.description}

- **Examples**:
${examplesBlock}

- **Constraints**:
${constraintsBlock}

- **Hints**:
${hintsBlock}${codeContext}`,
    stopWhen: isStepCount(3),
  })
}

export function buildChallengeChatMessages(dto: ChallengeChatRequestDto): ModelMessage[] {
  const history: ModelMessage[] = dto.messages
    .filter((msg) => !msg.id.startsWith('welcome') && msg.content.trim().length > 0)
    .slice(-14)
    .map((msg) => ({
      role: msg.from,
      content: msg.content,
    }))

  const trimmedPrompt = dto.prompt.trim()
  const last = history[history.length - 1]
  if (!last || last.role !== 'user' || last.content !== trimmedPrompt) {
    history.push({ role: 'user', content: trimmedPrompt })
  }

  return history
}
