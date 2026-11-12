/**
 * @file evaluate-code.dto.ts
 * @description DTOs for the unified challenge evaluation request/response cycle.
 */

import type { Language } from '../../engine-runner/sandboxVm.ts'
import type { Problem } from '../../../../src/shared/types/problem.ts'

export type EvaluationStatus = 'passed' | 'failed' | 'error'

export type EvaluationVerdict =
  | 'Accepted'
  | 'Wrong Answer'
  | 'Time Limit Exceeded'
  | 'Memory Limit Exceeded'
  | 'Runtime Error'
  | 'Compile Error'
  | 'Internal Error'

/**
 * Request payload sent by the client containing the challenge ID and user code submission.
 */
export interface EvaluateCodeDto {
  /** The target problem ID */
  problemId: number

  /** User code submission */
  code: string

  /** Target programming language */
  lang: Language

  /**
   * Execution mode:
   * - 'run': Evaluates visible test cases only (fast feedback in editor).
   * - 'submit': Evaluates all test cases including hidden test cases.
   * Defaults to 'run'.
   */
  mode?: 'run' | 'submit'

  /** Optional problem definition override (used for custom or AI-generated challenges) */
  problem?: Problem

  /** Optional per-case timeout override in milliseconds (default: 5000) */
  timeoutMs?: number

  /** Optional memory limit override in megabytes (default: 256) */
  memoryMb?: number
}

/**
 * Per-testcase evaluation outcome details.
 */
export interface TestCaseResultDto {
  id: number
  passed: boolean
  hidden: boolean
  input: string
  expected: string
  actual: string
  timeMs: number
  cpuMs: number
  memoryKb: number
  error?: string
}

/**
 * Complete evaluation result returned to the client.
 */
export interface EvaluationResultDto {
  /** High-level outcome: 'passed' (all tests passed), 'failed' (WA/TLE/RTE), or 'error' (compile failure) */
  status: EvaluationStatus

  /** Detailed competitive programming verdict */
  verdict: EvaluationVerdict

  /** Number of test cases that passed */
  passedCases: number

  /** Total number of test cases evaluated */
  totalCases: number

  /** Peak elapsed execution time across test cases (e.g. '12 ms') */
  runtime: string

  /** Peak memory usage across test cases (e.g. '3.8 MB') */
  memory: string

  /** Peak time in milliseconds */
  timeMs: number

  /** Peak memory in kilobytes */
  memoryKb: number

  /** Formatted output or stdout diagnostics for display */
  output: string

  /** Compiler error output if verdict === 'Compile Error' */
  compileError?: string

  /** Details on the first failed test case (if any test case failed) */
  failedCase?: {
    caseIndex: number
    hidden: boolean
    input: string
    expected: string
    actual: string
    error?: string
  }

  /** Granular results for each test case evaluated */
  testCases: TestCaseResultDto[]
}

