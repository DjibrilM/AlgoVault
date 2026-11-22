/**
 * @file agents/solution-feedback.subagent.ts
 * @description Specialized subagent that evaluates a user's submitted challenge solution,
 * providing encouraging yet realistic asymptotic optimization feedback, Mermaid flow diagrams,
 * KaTeX complexity breakdowns, and concise code blueprints rendered with Streamdown.
 */

import { isStepCount, ToolLoopAgent, type LanguageModel } from 'ai'
import type { SolutionFeedbackRequestDto } from '../../../../src/shared/types/ai.ts'

export function createSolutionFeedbackAgent(model: LanguageModel) {
  return new ToolLoopAgent({
    id: 'algovault-solution-feedback-coach',
    model,
    instructions: `You are AlgoVault's Performance & Complexity Coach subagent.
Your job is to help the user reach the highest level of algorithmic performance on their submitted solution.

Coaching guidelines:
1. **Encourage & stay realistic**:
   - Celebrate working logic or strong parts of their approach first.
   - If a meaningful asymptotic improvement exists (e.g. $O(n^2) \\to O(n)$, $O(n \\log n) \\to O(n)$, or unnecessary extra space), be direct and constructive — e.g., *"This is good, and you can simplify it to linear $O(n)$ time complexity by..."*.
   - If the submission already hits optimal asymptotic complexity and further speedups would only be tedious micro-optimizations (bit-twiddling, manual loop unrolling, sacrificing clarity for constant factors), be realistic and explicitly tell the user that their complexity is already optimal and tedious constant-factor tweaks aren't worth the trade-off.
   - If the submission failed test cases or had a compile/runtime error, pinpoint the root cause concisely and show how to fix it cleanly alongside complexity guidance.
2. **Format cleanly for Streamdown** (supports GitHub Markdown, KaTeX math, fenced code blocks, and Mermaid diagrams):
   - Start with a brief **Complexity Snapshot** (Current vs. Target Time & Space Complexity in KaTeX like \`$O(n)$\`).
   - Give your **Coach's Verdict** (1 concise paragraph).
   - Include a **Visual Flow / Optimization Path** using a clean \`\`\`mermaid\`\`\` diagram (\`flowchart LR\` or \`graph TD\`, quoting node labels containing parentheses/brackets like \`A["Hash Map Lookup O(1)"]\`) when it clarifies the algorithm or bottleneck.
   - End with an **Optimization Blueprint** in the user's language (focused snippet or skeleton showing the key pattern — avoid bloated boilerplate).`,
    stopWhen: isStepCount(3),
  })
}

export function buildSolutionFeedbackPrompt(dto: SolutionFeedbackRequestDto): string {
  const constraintsText =
    dto.problem.constraints.length > 0
      ? dto.problem.constraints.map((c) => `- ${c}`).join('\n')
      : '- Standard constraints'

  const examplesText =
    dto.problem.examples.length > 0
      ? dto.problem.examples
          .slice(0, 2)
          .map((ex, idx) => `Example ${idx + 1}: Input: ${ex.input} | Output: ${ex.output}`)
          .join('\n')
      : 'None provided'

  const submissionMeta = [
    `Status: ${dto.submission.status}`,
    dto.submission.verdict ? `Verdict: ${dto.submission.verdict}` : null,
    dto.submission.passedCases !== undefined && dto.submission.totalCases !== undefined
      ? `Passed Cases: ${dto.submission.passedCases}/${dto.submission.totalCases}`
      : null,
    dto.submission.runtime ? `Runtime: ${dto.submission.runtime}` : null,
    dto.submission.memory ? `Memory: ${dto.submission.memory}` : null,
    dto.submission.failedCaseIndex !== undefined
      ? `Failed Case #${dto.submission.failedCaseIndex}`
      : null,
    dto.submission.expected ? `Expected: ${dto.submission.expected}` : null,
    dto.submission.actual ? `Actual: ${dto.submission.actual}` : null,
    dto.submission.compileError ? `Compile Error: ${dto.submission.compileError}` : null,
    dto.submission.output && dto.submission.status === 'error'
      ? `Diagnostic Output:\n${dto.submission.output}`
      : null,
  ]
    .filter(Boolean)
    .join('\n')

  return `Review this submitted solution and give performance & optimization coaching.

### Challenge
- **Title**: ${dto.problem.title} (${dto.problem.difficulty}, ${dto.problem.category})
- **Description**:
${dto.problem.description}

- **Constraints**:
${constraintsText}

- **Sample Examples**:
${examplesText}

### Execution & Submission Result
${submissionMeta}

### Submitted Code (${dto.lang})
\`\`\`${dto.lang}
${dto.code}
\`\`\``
}
