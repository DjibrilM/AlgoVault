/**
 * @file ai.module.ts
 * @description NestJS-style AiModule encapsulating Vercel AI SDK multi-agent orchestration
 * (Master ToolLoopAgent + Catalog Analyst, Challenge Architect, and Challenge Verifier agents).
 */

import type { IpcMain } from 'electron'
import type { OnModuleDestroy, OnModuleInit } from '../code-test/common/lifecycle.ts'
import { AiController } from './controllers/ai.controller.ts'
import { AiService } from './services/ai.service.ts'
import type { AiModuleOptions } from './types/index.ts'

export class AiModule implements OnModuleInit, OnModuleDestroy {
  readonly service: AiService
  readonly controller: AiController
  private readonly ipcTarget: IpcMain | null

  constructor(options: AiModuleOptions = {}) {
    this.service = new AiService(options)
    this.controller = new AiController(this.service)
    this.ipcTarget = options.ipcMain ?? null
  }

  static forRoot(options?: AiModuleOptions): AiModule {
    const module = new AiModule(options)
    module.onModuleInit()
    return module
  }

  onModuleInit(): void {
    this.controller.registerIpc(this.ipcTarget ?? undefined)
  }

  async onModuleDestroy(): Promise<void> {
    this.controller.unregisterIpc(this.ipcTarget ?? undefined)
    await this.service.onModuleDestroy()
  }
}
