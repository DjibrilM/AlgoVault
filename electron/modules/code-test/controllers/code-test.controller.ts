/**
 * @file code-test.controller.ts
 * @description NestJS-style Controller routing IPC message patterns to the injected service.
 */

import type { IpcMain, IpcMainInvokeEvent } from 'electron'
import {
  CODE_TEST_CHANNELS,
  type ICodeTestController,
  type ICodeTestService,
  type RunCodeDto,
  type CodeTestResultDto,
  type VmStatusDto,
  type EvaluateCodeDto,
  type EvaluationResultDto,
  type SaveFactoryConversationDto,
} from '../types/index.ts'

// Safely resolve Electron's ipcMain if running inside the Electron main process
let electronIpcMain: IpcMain | null = null
try {
  if (typeof process !== 'undefined' && (process as any).type === 'browser') {
    const req = (globalThis as any).require
    if (req) {
      electronIpcMain = req('electron')?.ipcMain ?? null
    }
  }
} catch {
  // Running outside Electron
}

/**
 * NestJS-style Controller.
 *
 * Receives the `CodeTestService` provider injected via its constructor.
 * Maps incoming IPC message patterns to service methods and handles errors.
 */
export class CodeTestController implements ICodeTestController {
  private readonly codeTestService: ICodeTestService
  private registeredIpc: IpcMain | null = null

  /**
   * Dependency Injection: constructor receives the service provider instance.
   */
  constructor(codeTestService: ICodeTestService) {
    this.codeTestService = codeTestService
  }

  /**
   * Registers IPC handlers with Electron's ipcMain.
   *
   * @param ipc Optional custom IpcMain instance for testing or alternative dispatcher setups.
   */
  registerIpc(ipc: IpcMain | null = electronIpcMain): void {
    const targetIpc = ipc ?? electronIpcMain
    if (!targetIpc) {
      console.warn('[CodeTestController] No ipcMain available to register handlers.')
      return
    }

    if (this.registeredIpc) {
      this.unregisterIpc(this.registeredIpc)
    }

    this.registeredIpc = targetIpc

    // Message pattern: code-test:evaluate
    targetIpc.handle(
      CODE_TEST_CHANNELS.EVALUATE,
      async (_event: IpcMainInvokeEvent, dto: EvaluateCodeDto): Promise<EvaluationResultDto> => {
        return this.evaluate(dto)
      }
    )

    // Message pattern: code-test:run
    targetIpc.handle(
      CODE_TEST_CHANNELS.RUN,
      async (_event: IpcMainInvokeEvent, dto: RunCodeDto): Promise<CodeTestResultDto> => {
        return this.run(dto)
      }
    )

    // Message pattern: code-test:start-vm
    targetIpc.handle(
      CODE_TEST_CHANNELS.START_VM,
      async (): Promise<VmStatusDto> => {
        return this.startVm()
      }
    )

    // Message pattern: code-test:stop-vm
    targetIpc.handle(
      CODE_TEST_CHANNELS.STOP_VM,
      async (): Promise<{ success: boolean }> => {
        return this.stopVm()
      }
    )

    // Message pattern: code-test:get-status
    targetIpc.handle(
      CODE_TEST_CHANNELS.GET_STATUS,
      (): VmStatusDto => {
        return this.getStatus()
      }
    )

    // Message pattern: db:get-workspace-data
    targetIpc.handle(
      CODE_TEST_CHANNELS.GET_WORKSPACE_DATA,
      async () => {
        return this.codeTestService.getWorkspaceData()
      }
    )

    // Message pattern: db:save-challenge-progress
    targetIpc.handle(
      CODE_TEST_CHANNELS.SAVE_CHALLENGE_PROGRESS,
      async (
        _event: IpcMainInvokeEvent,
        dto: { challengeId: number; solution?: string; solved?: boolean; starred?: boolean }
      ) => {
        return this.codeTestService.saveChallengeProgress(dto)
      }
    )

    // Message pattern: db:create-category
    targetIpc.handle(
      CODE_TEST_CHANNELS.CREATE_CATEGORY,
      async (_event: IpcMainInvokeEvent, dto: Parameters<ICodeTestService['createCategory']>[0]) => {
        return this.codeTestService.createCategory(dto)
      }
    )

    // Message pattern: db:get-submissions
    targetIpc.handle(
      CODE_TEST_CHANNELS.GET_SUBMISSIONS,
      async (_event: IpcMainInvokeEvent, challengeId?: number) => {
        return this.codeTestService.getSubmissions(challengeId)
      }
    )

    // Message pattern: db:get-favorites
    targetIpc.handle(
      CODE_TEST_CHANNELS.GET_FAVORITES,
      async () => {
        return this.codeTestService.getFavorites()
      }
    )

    // Message pattern: db:toggle-favorite
    targetIpc.handle(
      CODE_TEST_CHANNELS.TOGGLE_FAVORITE,
      async (_event: IpcMainInvokeEvent, challengeId: number) => {
        return this.codeTestService.toggleFavorite(challengeId)
      }
    )

    // Message pattern: db:get-factory-conversations
    targetIpc.handle(
      CODE_TEST_CHANNELS.GET_FACTORY_CONVERSATIONS,
      async (_event: IpcMainInvokeEvent, dto?: { page?: number; limit?: number }) => {
        return this.codeTestService.getFactoryConversations(dto)
      }
    )

    // Message pattern: db:save-factory-conversation
    targetIpc.handle(
      CODE_TEST_CHANNELS.SAVE_FACTORY_CONVERSATION,
      async (_event: IpcMainInvokeEvent, dto: SaveFactoryConversationDto) => {
        return this.codeTestService.saveFactoryConversation(dto)
      }
    )
  }

  /**
   * Unregisters IPC handlers during module destruction.
   */
  unregisterIpc(ipc: IpcMain | null = this.registeredIpc ?? electronIpcMain): void {
    const targetIpc = ipc ?? this.registeredIpc ?? electronIpcMain
    if (!targetIpc) return

    try {
      targetIpc.removeHandler(CODE_TEST_CHANNELS.EVALUATE)
      targetIpc.removeHandler(CODE_TEST_CHANNELS.RUN)
      targetIpc.removeHandler(CODE_TEST_CHANNELS.START_VM)
      targetIpc.removeHandler(CODE_TEST_CHANNELS.STOP_VM)
      targetIpc.removeHandler(CODE_TEST_CHANNELS.GET_STATUS)
      targetIpc.removeHandler(CODE_TEST_CHANNELS.GET_WORKSPACE_DATA)
      targetIpc.removeHandler(CODE_TEST_CHANNELS.SAVE_CHALLENGE_PROGRESS)
      targetIpc.removeHandler(CODE_TEST_CHANNELS.CREATE_CATEGORY)
      targetIpc.removeHandler(CODE_TEST_CHANNELS.GET_SUBMISSIONS)
      targetIpc.removeHandler(CODE_TEST_CHANNELS.GET_FAVORITES)
      targetIpc.removeHandler(CODE_TEST_CHANNELS.TOGGLE_FAVORITE)
      targetIpc.removeHandler(CODE_TEST_CHANNELS.GET_FACTORY_CONVERSATIONS)
      targetIpc.removeHandler(CODE_TEST_CHANNELS.SAVE_FACTORY_CONVERSATION)
    } catch {
      // Ignored if handlers were not previously registered
    } finally {
      if (this.registeredIpc === targetIpc) {
        this.registeredIpc = null
      }
    }
  }

  /**
   * Handler for `code-test:evaluate` message pattern.
   * Receives challenge ID and code, delegates to service, and returns comprehensive evaluation.
   */
  async evaluate(dto: EvaluateCodeDto): Promise<EvaluationResultDto> {
    return this.codeTestService.evaluate(dto)
  }

  /**
   * Handler for `code-test:run` message pattern.
   */
  async run(dto: RunCodeDto): Promise<CodeTestResultDto> {
    try {
      return await this.codeTestService.runCode(dto)
    } catch (err: any) {
      return {
        success: false,
        runs: [],
        error: err?.message ?? String(err),
      }
    }
  }

  /**
   * Handler for `code-test:start-vm` message pattern.
   */
  async startVm(): Promise<VmStatusDto> {
    return this.codeTestService.startVm()
  }

  /**
   * Handler for `code-test:stop-vm` message pattern.
   */
  async stopVm(): Promise<{ success: boolean }> {
    await this.codeTestService.stopVm()
    return { success: true }
  }

  /**
   * Handler for `code-test:get-status` message pattern.
   */
  getStatus(): VmStatusDto {
    return this.codeTestService.getStatus()
  }
}

