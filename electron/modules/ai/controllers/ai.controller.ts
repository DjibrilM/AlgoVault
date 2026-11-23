/**
 * @file controllers/ai.controller.ts
 * @description NestJS-style Controller mapping `ai:*` IPC channels to AiService
 * and broadcasting streaming agent events to renderer windows.
 */

import { createRequire } from 'node:module'
import type { BrowserWindow, IpcMain, IpcMainInvokeEvent, WebContents } from 'electron'
import {
  AI_CHANNELS,
  type AiConnectionTestResultDto,
  type AiModelOptionDto,
  type AiProviderStatusDto,
  type AiStreamEvent,
  type ChallengeChatRequestDto,
  type ChallengeChatResultDto,
  type SaveAiConfigDto,
  type SolutionFeedbackRequestDto,
  type SolutionFeedbackResultDto,
  type StudioTurnRequestDto,
  type StudioTurnResultDto,
} from '../../../../src/shared/types/ai.ts'
import type { IAiController, IAiService } from '../types/index.ts'

let electronIpcMain: IpcMain | null = null
let electronBrowserWindow: typeof BrowserWindow | null = null
try {
  if (typeof process !== 'undefined' && (process as NodeJS.Process & { type?: string }).type === 'browser') {
    const req = createRequire(import.meta.url)
    const electron = req('electron') as typeof import('electron')
    electronIpcMain = electron?.ipcMain ?? null
    electronBrowserWindow = electron?.BrowserWindow ?? null
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

  private broadcastEvent(event: AiStreamEvent, sender?: WebContents): void {
    let sentToSender = false
    if (sender && !sender.isDestroyed?.()) {
      sender.send(AI_CHANNELS.STREAM_EVENT, event)
      sentToSender = true
    }

    if (!electronBrowserWindow) return
    for (const win of electronBrowserWindow.getAllWindows()) {
      if (!win.isDestroyed() && (!sentToSender || win.webContents !== sender)) {
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
      async (event: IpcMainInvokeEvent, dto: StudioTurnRequestDto) => {
        return this.runStudioTurn(dto, event?.sender)
      }
    )

    targetIpc.handle(
      AI_CHANNELS.RUN_SOLUTION_FEEDBACK,
      async (event: IpcMainInvokeEvent, dto: SolutionFeedbackRequestDto) => {
        return this.runSolutionFeedback(dto, event?.sender)
      }
    )

    targetIpc.handle(
      AI_CHANNELS.RUN_CHALLENGE_CHAT,
      async (event: IpcMainInvokeEvent, dto: ChallengeChatRequestDto) => {
        return this.runChallengeChat(dto, event?.sender)
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
      AI_CHANNELS.RUN_SOLUTION_FEEDBACK,
      AI_CHANNELS.RUN_CHALLENGE_CHAT,
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

  runStudioTurn(dto: StudioTurnRequestDto, sender?: WebContents): Promise<StudioTurnResultDto> {
    return this.aiService.runStudioTurn(dto, (event) => {
      this.broadcastEvent(event, sender)
    })
  }

  runSolutionFeedback(
    dto: SolutionFeedbackRequestDto,
    sender?: WebContents
  ): Promise<SolutionFeedbackResultDto> {
    return this.aiService.runSolutionFeedback(dto, (event) => {
      this.broadcastEvent(event, sender)
    })
  }

  runChallengeChat(
    dto: ChallengeChatRequestDto,
    sender?: WebContents
  ): Promise<ChallengeChatResultDto> {
    return this.aiService.runChallengeChat(dto, (event) => {
      this.broadcastEvent(event, sender)
    })
  }

  abortRun(runId: string): { aborted: boolean } {
    return this.aiService.abortRun(runId)
  }
}
