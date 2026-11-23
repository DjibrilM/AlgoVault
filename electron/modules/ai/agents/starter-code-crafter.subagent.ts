/**
 * @file agents/starter-code-crafter.subagent.ts
 * @description Dedicated subagent whose sole responsibility is crafting idiomatic,
 * self-contained starter code across TypeScript, JavaScript, Python, and C++ for
 * each architected challenge — including any required Node/TreeNode/ListNode definitions.
 */

import { isStepCount, Output, ToolLoopAgent, type LanguageModel } from 'ai'
import { z } from 'zod'
import type { ArchitectedChallenge, ArchitectedChallengeSet } from '../types/index.ts'

export const StarterCodeItemSchema = z.object({
  title: z.string().describe('Exact title of the challenge being crafted'),
  initialSolutions: z.object({
    typescript: z.string(),
    javascript: z.string(),
    python: z.string(),
    cpp: z.string(),
  }),
})

export const StarterCodeBatchSchema = z.object({
  challenges: z.array(StarterCodeItemSchema),
})

export type StarterCodeBatch = z.infer<typeof StarterCodeBatchSchema>

export function createStarterCodeCrafterSubagent(model: LanguageModel) {
  return new ToolLoopAgent({
    id: 'algovault-starter-code-crafter',
    model,
    instructions: `You are AlgoVault's Starter Code Crafter subagent.
Your ONLY job is to craft clean, idiomatic, self-contained starter code templates in all 4 languages ("typescript", "javascript", "python", "cpp") for each challenge provided.

Strict rules for EVERY challenge:
1. NEVER copy TypeScript syntax into javascript, python, or cpp. Each language MUST use its own native syntax:
   - "typescript": Valid TypeScript function signature with explicit parameter & return types (e.g. \`function twoSum(nums: number[], target: number): number[] {\n  \n}\`).
   - "javascript": Plain ES6 JavaScript with ZERO TypeScript type annotations (no \`: number\`, no \`: Node | null\`, no generics). Use \`function ...(...) {\n  \n}\` or JSDoc comments if helpful.
   - "python": Valid Python 3 \`def\` signature (snake_case or matching name) with \`pass\`, NEVER the \`function\` keyword (e.g. \`def two_sum(nums: list[int], target: int) -> list[int]:\n    pass\`).
   - "cpp": Idiomatic C++ function (e.g. \`vector<int> twoSum(vector<int>& nums, int target) {\n    \n}\`), NEVER the \`function\` keyword or TS \`: Type\` annotations.

2. SELF-CONTAINED CUSTOM TYPES (CRITICAL):
   - Prefer standard built-in types (\`number[]\`, \`string\`, \`boolean\`, \`number\`, \`vector<int>\`, \`list[int]\`) whenever possible.
   - Whenever a starter signature references ANY custom type such as \`Node\`, \`ListNode\`, \`TreeNode\`, \`DoublyListNode\`, \`GraphNode\`, or \`Interval\`, you MUST define that type/class/struct right above the starter function in EVERY language that uses it:
     * typescript: \`interface Node { val: number; prev: Node | null; next: Node | null; child: Node | null; }\` (or \`class Node { ... }\`)
     * javascript: \`class Node { constructor(val = 0, prev = null, next = null, child = null) { this.val = val; this.prev = prev; this.next = next; this.child = child; } }\`
     * python: \`class Node:\n    def __init__(self, val=0, prev=None, next=None, child=None):\n        self.val = val\n        self.prev = prev\n        self.next = next\n        self.child = child\`
     * cpp: \`class Node {\npublic:\n    int val;\n    Node* prev;\n    Node* next;\n    Node* child;\n};\`

3. Pure LeetCode-style starter code ONLY — NO stdin/stdout boilerplate (no \`readFileSync\`, \`input()\`, \`sys.stdin\`, \`cin/cout\`, or \`int main\`).
4. FORMATTING (CRITICAL):
   - Always output clean, readable, multi-line formatted code — NEVER collapse functions or interfaces onto a single line like \`function foo(): void { }\`.
   - Use 2-space indentation for TypeScript and JavaScript, and 4-space indentation for Python and C++.
   - Put an indented blank line inside empty function bodies (e.g. \`function solve(nums: number[]): number {\n  \n}\`).
   - Separate any custom type/class/struct definition from the starter function with a single blank line.
5. Match the parameter names, parameter order, and logical types from the challenge's description, examples, and testCases.
6. Return one entry per input challenge with the exact matching "title".`,
    output: Output.object({
      schema: StarterCodeBatchSchema,
    }),
    stopWhen: isStepCount(4),
  })
}

function formatStarterCode(
  code: string,
  lang: 'typescript' | 'javascript' | 'python' | 'cpp'
): string {
  const indent = lang === 'python' || lang === 'cpp' ? '    ' : '  '
  let formatted = code
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .trim()

  if (lang === 'python') {
    formatted = formatted.replace(/^(def\s+[^\n:]+:)\s+pass\s*$/gm, `$1\n${indent}pass`)
  } else {
    formatted = formatted.replace(/\{\s*\}\s*$/gm, `{\n${indent}\n}`)
  }

  return formatted.replace(/\n{3,}/g, '\n\n')
}

function formatInitialSolutions(
  solutions: StarterCodeBatch['challenges'][number]['initialSolutions']
) {
  return {
    typescript: formatStarterCode(solutions.typescript, 'typescript'),
    javascript: formatStarterCode(solutions.javascript, 'javascript'),
    python: formatStarterCode(solutions.python, 'python'),
    cpp: formatStarterCode(solutions.cpp, 'cpp'),
  }
}

/**
 * Runs the dedicated Starter Code Crafter subagent for an architected challenge set
 * and merges the crafted per-language `initialSolutions` back into each challenge.
 */
export async function craftStarterCodeForSet(params: {
  model: LanguageModel
  set: ArchitectedChallengeSet
  abortSignal?: AbortSignal
}): Promise<ArchitectedChallengeSet> {
  if (params.set.challenges.length === 0) {
    return params.set
  }

  const crafter = createStarterCodeCrafterSubagent(params.model)
  const summaryPayload = params.set.challenges.map((ch: ArchitectedChallenge) => ({
    title: ch.title,
    description: ch.description,
    examples: ch.examples.slice(0, 2),
    sampleTestCase: ch.testCases[0] ?? null,
    existingStarterHint: ch.initialSolutions,
  }))

  const result = await crafter.generate({
    prompt: `Craft self-contained, idiomatic starter code in typescript, javascript, python, and cpp for these ${summaryPayload.length} challenge(s):\n\n${JSON.stringify(summaryPayload, null, 2)}`,
    abortSignal: params.abortSignal,
  })

  const byTitle = new Map(
    result.output.challenges.map((item) => [item.title.trim().toLowerCase(), item.initialSolutions])
  )

  const mergedChallenges = params.set.challenges.map((ch, idx) => {
    const matched =
      byTitle.get(ch.title.trim().toLowerCase()) ?? result.output.challenges[idx]?.initialSolutions
    if (!matched) {
      return ch
    }
    return {
      ...ch,
      initialSolutions: formatInitialSolutions(matched),
    }
  })

  return {
    ...params.set,
    challenges: mergedChallenges,
  }
}
