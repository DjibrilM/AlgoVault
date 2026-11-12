/**
 * @file index.ts
 * @description Channel routing constants, options, and layer interfaces for code-test.
 */

import type { IpcMain } from 'electron'
import type { SandboxVmOptions } from '../../engine-runner/sandboxVm.ts'
import type { ITypeCheckerService } from '../services/type-checker.service.ts'
import type {
  RunCodeDto,
  CodeTestResultDto,
  VmStatusDto,
  EvaluateCodeDto,
  EvaluationResultDto,
} from '../dto/index.ts'

export * from '../dto/index.ts'

/**
 * IPC route channels matching the NestJS microservice message pattern style.
 */
export const CODE_TEST_CHANNELS = {
  /** Unified evaluate endpoint: receives challengeId + code, returns pass/fail and telemetry */
  EVALUATE: 'code-test:evaluate',
  /** Low-level run endpoint: executes arbitrary raw test cases */
  RUN: 'code-test:run',
  /** Explicitly start / warm-up the sandbox virtual machine */
  START_VM: 'code-test:start-vm',
  /** Gracefully power off the sandbox virtual machine */
  STOP_VM: 'code-test:stop-vm',
  /** Query current health and runtime status of the sandbox virtual machine */
  GET_STATUS: 'code-test:get-status',
} as const

export type CodeTestChannel = (typeof CODE_TEST_CHANNELS)[keyof typeof CODE_TEST_CHANNELS]

/**
 * Configuration options for the CodeTestService provider.
 */
export interface CodeTestServiceOptions extends Partial<SandboxVmOptions> {
  /**
   * Whether to automatically boot the virtual machine when the service is instantiated.
   * Defaults to false (lazy boot on first test run).
   */
  autoStart?: boolean
  /**
   * Optional custom TypeScript type-checker service for static analysis.
   */
  typeChecker?: ITypeCheckerService
}

/**
 * Service contract for the code-test provider.
 */
export interface ICodeTestService {
  /** Evaluates code for a specific challenge ID and returns comprehensive pass/fail results */
  evaluate(dto: EvaluateCodeDto): Promise<EvaluationResultDto>

  /** Low-level execution for arbitrary code and test cases */
  runCode(dto: RunCodeDto): Promise<CodeTestResultDto>

  /** Boots the micro-VM */
  startVm(): Promise<VmStatusDto>

  /** Stops the micro-VM */
  stopVm(): Promise<void>

  /** Queries VM status */
  getStatus(): VmStatusDto
}

/**
 * Controller contract for handling IPC message patterns.
 */
export interface ICodeTestController {
  registerIpc(ipc?: IpcMain): void
  unregisterIpc(ipc?: IpcMain): void
  evaluate(dto: EvaluateCodeDto): Promise<EvaluationResultDto>
  run(dto: RunCodeDto): Promise<CodeTestResultDto>
  startVm(): Promise<VmStatusDto>
  stopVm(): Promise<{ success: boolean }>
  getStatus(): VmStatusDto
}

/**
 * Configuration options for CodeTestModule.forRoot().
 */
export interface CodeTestModuleOptions extends CodeTestServiceOptions {
  /** Optional custom ipcMain instance (useful for testing) */
  ipcMain?: IpcMain
}
