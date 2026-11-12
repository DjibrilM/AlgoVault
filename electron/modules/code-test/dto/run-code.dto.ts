/**
 * @file run-code.dto.ts
 * @description NestJS DTOs for code execution requests and responses.
 */

import type { Language, ExecResult } from '../../engine-runner/sandboxVm.ts'

export type { Language, ExecResult }

/**
 * Data Transfer Object for code execution requests received over IPC.
 */
export interface RunCodeDto {
  /** Target programming language for the submission */
  lang: Language

  /** Source code to execute */
  code: string

  /** Array of test cases containing standard input */
  tests?: { stdin?: string }[]

  /** Standard input for single-run problems */
  stdin?: string

  /** Maximum execution time per test case in milliseconds (default: 5000) */
  timeoutMs?: number

  /** Maximum compilation time in milliseconds for C/C++ (default: 20000) */
  compileTimeoutMs?: number

  /** Maximum memory in megabytes (default: 256) */
  memoryMb?: number
}

/**
 * Data Transfer Object for code execution results returned over IPC.
 */
export interface CodeTestResultDto {
  /** True if execution completed successfully without sandbox harness errors */
  success: boolean

  /** Output from compilation step (null for interpreted / JIT languages) */
  compile?: ExecResult | null

  /** Individual test case execution results */
  runs: ExecResult[]

  /** Error message if an internal VM or execution failure occurred */
  error?: string
}

