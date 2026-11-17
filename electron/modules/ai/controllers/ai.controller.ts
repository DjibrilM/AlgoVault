/**
 * @file controllers/ai.controller.ts
 * @description NestJS-style Controller mapping `ai:*` IPC channels to AiService
 * and broadcasting streaming agent events to renderer windows.
 */

import type { BrowserWindow, IpcMain, IpcMainInvokeEvent } from 'electron'
import {
  AI_CHANNELS,
  type AiConnectionTestResultDto,
  type AiModelOptionDto,
  type AiProviderStatusDto,
  type AiStreamEvent,
  type SaveAiConfigDto,
  type StudioTurnRequestDto,
  type StudioTurnResultDto,
} from '../../../../src/shared/types/ai.ts'
import type { IAiController, IAiService } from '../types/index.ts'

let electronIpcMain: IpcMain | null = null
let electronBrowserWindow: typeof BrowserWindow | null = null
try {
  if (typeof process !== 'undefined' && (process as NodeJS.Process & { type?: string }).type === 'browser') {
    const req = (globalThis as { require?: NodeRequire }).require
    if (req) {
      const electron = req('electron') as typeof import('electron')
      electronIpcMain = electron?.ipcMain ?? null
      electronBrowserWindow = electron?.BrowserWindow ?? null
    }
  }
} catch {
  // Running outside Electron main (unit tests)
}

export class AiController implements IAiController {
  private readonly aiService: IAiService
  private registeredIpc: IpcMain | null = null

  constructor(aiService: IAiService) {
    this.aiService = aiService
  }

  private broadcastEvent(event: AiStreamEvent): void {
    if (!electronBrowserWindow) return
    for (const win of electronBrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send(AI_CHANNELS.STREAM_EVENT, event)
      }
    }
  }

  registerIpc(ipc: IpcMain | null = electronIpcMain): void {
    const targetIpc = ipc ?? electronIpcMain
    if (!targetIpc) {
      console.warn('[AiController] No ipcMain available to register handlers.')
      return
    }

    if (this.registeredIpc) {
      this.unregisterIpc(this.registeredIpc)
    }

    this.registeredIpc = targetIpc

    targetIpc.handle(AI_CHANNELS.GET_CONFIG, async () => {
      return this.getConfig()
    })

    targetIpc.handle(
      AI_CHANNELS.SAVE_CONFIG,
      async (_event: IpcMainInvokeEvent, dto: SaveAiConfigDto) => {
        return this.saveConfig(dto)
      }
    )

    targetIpc.handle(
      AI_CHANNELS.LIST_MODELS,
      async (_event: IpcMainInvokeEvent, dto?: SaveAiConfigDto) => {
        return this.listModels(dto)
      }
    )

    targetIpc.handle(
      AI_CHANNELS.TEST_CONNECTION,
      async (_event: IpcMainInvokeEvent, dto?: SaveAiConfigDto) => {
        return this.testConnection(dto)
      }
    )

    targetIpc.handle(
      AI_CHANNELS.RUN_STUDIO_TURN,
      async (_event: IpcMainInvokeEvent, dto: StudioTurnRequestDto) => {
        return this.runStudioTurn(dto)
      }
    )

    targetIpc.handle(
      AI_CHANNELS.ABORT_RUN,
      async (_event: IpcMainInvokeEvent, runId: string) => {
        return this.abortRun(runId)
      }
    )
  }

  unregisterIpc(ipc: IpcMain | null = this.registeredIpc ?? electronIpcMain): void {
    const targetIpc = ipc ?? this.registeredIpc ?? electronIpcMain
    if (!targetIpc) return

    for (const channel of [
      AI_CHANNELS.GET_CONFIG,
      AI_CHANNELS.SAVE_CONFIG,
      AI_CHANNELS.LIST_MODELS,
      AI_CHANNELS.TEST_CONNECTION,
      AI_CHANNELS.RUN_STUDIO_TURN,
      AI_CHANNELS.ABORT_RUN,
    ]) {
      try {
        targetIpc.removeHandler(channel)
      } catch {
        // Ignored if handler wasn't registered
      }
    }

    if (this.registeredIpc === targetIpc) {
      this.registeredIpc = null
    }
  }

  getConfig(): Promise<AiProviderStatusDto> {
    return this.aiService.getConfig()
  }

  saveConfig(dto: SaveAiConfigDto): Promise<AiProviderStatusDto> {
    return this.aiService.saveConfig(dto)
  }

  listModels(dto?: SaveAiConfigDto): Promise<AiModelOptionDto[]> {
    return this.aiService.listModels(dto)
  }

  testConnection(dto?: SaveAiConfigDto): Promise<AiConnectionTestResultDto> {
    return this.aiService.testConnection(dto)
  }

  runStudioTurn(dto: StudioTurnRequestDto): Promise<StudioTurnResultDto> {
    return this.aiService.runStudioTurn(dto, (event) => {
      this.broadcastEvent(event)
    })
  }

  abortRun(runId: string): { aborted: boolean } {
    return this.aiService.abortRun(runId)
  }
}
