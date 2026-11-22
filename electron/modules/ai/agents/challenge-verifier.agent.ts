/**
 * @file agents/challenge-verifier.agent.ts
 * @description Small verification tool agent that validates TypeScript starter signatures
 * (via TypeCheckerService + AST parsing), starter language completeness, and test case integrity
 * before challenges are persisted to SQLite.
 */

import { isStepCount, tool, ToolLoopAgent, type LanguageModel } from 'ai'
import { z } from 'zod'
import { extractFunctionMetadata } from '../../../../src/modules/challenge/utils/babelInjector.ts'
import type { AiStreamEvent } from '../../../../src/shared/types/ai.ts'
import { TypeCheckerService } from '../../code-test/services/type-checker.service.ts'
import type { ArchitectedChallengeSet, VerificationReport } from '../types/index.ts'

export function auditArchitectedChallengeSet(set: ArchitectedChallengeSet): VerificationReport {
  const typeChecker = new TypeCheckerService()
  const issues: string[] = []
  const warnings: string[] = []

  if (set.challenges.length === 0) {
    issues.push('No challenges were generated.')
  }

  for (const ch of set.challenges) {
    const label = `"${ch.title}"`

    // 1. Validate TypeScript starter syntax & return types via static AST checker
    const tsErrors = typeChecker.checkTypeScript(ch.initialSolutions.typescript)
    if (tsErrors.length > 0) {
      issues.push(`${label} TypeScript starter error: ${tsErrors[0]}`)
    }

    // 2. Ensure pure LeetCode-style signature parses cleanly in AST harness injector
    const tsMeta = extractFunctionMetadata(ch.initialSolutions.typescript)
    if (!tsMeta) {
      warnings.push(`${label}: could not detect a top-level function/Solution method in TypeScript template`)
    }

    const jsCode = ch.initialSolutions.javascript
    const pyCode = ch.initialSolutions.python
    const cppCode = ch.initialSolutions.cpp
    const tsCode = ch.initialSolutions.typescript

    const jsMeta = extractFunctionMetadata(jsCode)
    if (!jsMeta) {
      warnings.push(`${label}: could not detect a top-level function/Solution method in JavaScript template`)
    }

    // 3. Ensure each language uses its own native syntax (no TS/JS leakage across languages)
    if (/\)\s*:\s*[A-Za-z_${[]/.test(jsCode) || /\b[A-Za-z_]\w*\s*:\s*(number|string|boolean|any|unknown|void|null|undefined|Record|Array)\b/.test(jsCode)) {
      issues.push(`${label}: JavaScript starter contains TypeScript type annotations; remove all ': Type' annotations`)
    }
    if (!/\bdef\s+[A-Za-z_]\w*\s*\(/.test(pyCode) || /\bfunction\s+[A-Za-z_]/.test(pyCode)) {
      issues.push(`${label}: Python starter must use a Python 'def ...():' signature, not JS/TS 'function'`)
    }
    if (!cppCode.trim() || /\bfunction\s+[A-Za-z_]/.test(cppCode) || /\b:\s*(number|string|boolean|any|unknown|null|undefined)\b/.test(cppCode)) {
      issues.push(`${label}: C++ starter must use C++ return/parameter types, not JS/TS 'function' or ': Type' syntax`)
    }
    if (/:\s*\w+/.test(tsCode) && (jsCode.trim() === tsCode.trim() || cppCode.trim() === tsCode.trim())) {
      issues.push(`${label}: starter code was copied identically across languages; each language must use its own syntax`)
    }

    // 4. Ensure custom node/struct types referenced in starter signatures are actually defined
    const customTypeNames = ['Node', 'ListNode', 'TreeNode', 'DoublyListNode', 'GraphNode', 'Interval']
    for (const typeName of customTypeNames) {
      const typeRefRe = new RegExp(`\\b${typeName}\\b`)
      if (typeRefRe.test(tsCode)) {
        const tsDeclRe = new RegExp(`\\b(?:interface|class|type)\\s+${typeName}\\b`)
        if (!tsDeclRe.test(tsCode)) {
          issues.push(`${label}: TypeScript starter references "${typeName}" without defining interface/class/type ${typeName}`)
        }
      }
      if (typeRefRe.test(cppCode)) {
        const cppDeclRe = new RegExp(`\\b(?:class|struct)\\s+${typeName}\\b`)
        if (!cppDeclRe.test(cppCode)) {
          issues.push(`${label}: C++ starter references "${typeName}" without defining class/struct ${typeName}`)
        }
      }
      if (typeRefRe.test(pyCode)) {
        const pyDeclRe = new RegExp(`\\bclass\\s+${typeName}\\b`)
        if (!pyDeclRe.test(pyCode)) {
          issues.push(`${label}: Python starter references "${typeName}" without defining class ${typeName}`)
        }
      }
    }

    if (tsCode.includes('readFileSync')) {
      warnings.push(`${label}: TypeScript starter includes raw stdin boilerplate instead of pure function signature`)
    }
    if (pyCode.includes('sys.stdin') || pyCode.includes('input(')) {
      warnings.push(`${label}: Python starter includes stdin boilerplate instead of pure def signature`)
    }
    if (cppCode.includes('int main')) {
      warnings.push(`${label}: C++ starter includes int main() instead of pure function/Solution method`)
    }

    if (ch.testCases.length < 5) {
      issues.push(
        `${label}: expected at least 5 test cases (2 visible + 3 hidden), found ${ch.testCases.length}`
      )
    }

    const hiddenCount = ch.testCases.filter((tc) => Boolean(tc.hidden)).length
    if (hiddenCount < 3) {
      issues.push(`${label}: expected at least 3 hidden test cases, found ${hiddenCount}`)
    }

    if (ch.examples.length < 1) {
      issues.push(`${label}: expected at least 1 example`)
    }
  }

  return {
    valid: issues.length === 0,
    checkedCount: set.challenges.length,
    issues,
    warnings,
  }
}

export function createChallengeVerifierSubagent(
  model: LanguageModel,
  getBuiltSet: () => ArchitectedChallengeSet | null
) {
  return new ToolLoopAgent({
    model,
    instructions: `You are AlgoVault's Challenge Verifier subagent.
Run static AST & test-suite verification on the buffered challenges and summarize pass/fail checks concisely.`,
    stopWhen: isStepCount(4),
    tools: {
      auditBufferedChallenges: tool({
        description: 'Run static TypeScript AST/type checks and completeness checks on all buffered challenges.',
        inputSchema: z.object({}),
        execute: async () => {
          const current = getBuiltSet()
          if (!current) {
            return {
              valid: false,
              checkedCount: 0,
              issues: ['No generated challenge set is buffered yet.'],
              warnings: [],
            }
          }
          return auditArchitectedChallengeSet(current)
        },
      }),
    },
  })
}

export function createVerifyChallengeSetTool(params: {
  runId: string
  emitEvent: (event: AiStreamEvent) => void
  getBuiltSet: () => ArchitectedChallengeSet | null
  onVerified: (report: VerificationReport) => void
}) {
  return tool({
    description:
      'Run the Challenge Verifier tool agent on the buffered generated challenges to validate TypeScript syntax, AST harness compatibility, starter templates, and test cases before saving.',
    inputSchema: z.object({
      strict: z.boolean().optional().default(true),
    }),
    execute: async () => {
      const current = params.getBuiltSet()
      if (!current) {
        return {
          valid: false,
          checkedCount: 0,
          issues: ['No generated challenge set available to verify. Call invokeChallengeArchitect first.'],
          warnings: [],
        }
      }

      params.emitEvent({
        runId: params.runId,
        type: 'agent-stage',
        agent: 'challenge-verifier',
        label: 'Let me polish the hints and tests...',
        detail: `Verifying ${current.challenges.length} starter templates & test suites`,
        toolName: 'verifyChallengeSet',
      })

      const report = auditArchitectedChallengeSet(current)
      params.onVerified(report)
      return report
    },
    toModelOutput: ({ output }) => ({
      type: 'text',
      value: output.valid
        ? `Verified ${output.checkedCount} challenge(s) cleanly.${output.warnings.length > 0 ? ` Warnings: ${output.warnings.join('; ')}` : ''}`
        : `Verification found ${output.issues.length} issue(s): ${output.issues.join('; ')}`,
    }),
  })
}

