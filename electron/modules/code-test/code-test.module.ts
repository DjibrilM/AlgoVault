/**
 * @file code-test.module.ts
 * @description NestJS-style Module coordinating controllers and service providers.
 *
 * Implements the NestJS architecture:
 * - Module defines providers (CodeTestService) and controllers (CodeTestController).
 * - Implements OnModuleInit and OnModuleDestroy lifecycle hooks.
 * - Manages Dependency Injection: instantiates the service provider and injects it into the controller.
 */

import type { IpcMain } from 'electron'
import { CodeTestService } from './services/index.ts'
import { CodeTestController } from './controllers/index.ts'
import type { OnModuleInit, OnModuleDestroy } from './common/lifecycle.ts'
import type { CodeTestModuleOptions } from './types/index.ts'

/**
 * NestJS-style Feature Module.
 *
 * Encapsulates:
 * - `providers`: [CodeTestService]
 * - `controllers`: [CodeTestController]
 */
export class CodeTestModule implements OnModuleInit, OnModuleDestroy {
  /** The injected Service Provider */
  readonly service: CodeTestService

  /** The injected Controller */
  readonly controller: CodeTestController

  private readonly ipcTarget: IpcMain | null

  /**
   * Initializes the module and resolves dependencies via constructor injection.
   */
  constructor(options: CodeTestModuleOptions = {}) {
    // 1. Providers: instantiate service
    this.service = new CodeTestService(options)

    // 2. Controllers: instantiate controller with injected service provider (Dependency Injection)
    this.controller = new CodeTestController(this.service)

    this.ipcTarget = options.ipcMain ?? null
  }

  /**
   * NestJS Dynamic Module factory method (analogous to `TypeOrmModule.forRoot()` or `AppModule.forRoot()`).
   *
   * @param options Module configuration options.
   * @returns Fully configured CodeTestModule instance.
   */
  static forRoot(options?: CodeTestModuleOptions): CodeTestModule {
    const module = new CodeTestModule(options)
    // Automatically register IPC handlers upon forRoot initialization
    module.onModuleInit()
    return module
  }

  /**
   * NestJS Lifecycle Hook: Invoked when the module is initialized.
   * Registers IPC handlers with Electron.
   */
  onModuleInit(): void {
    this.controller.registerIpc(this.ipcTarget ?? undefined)
  }

  /**
   * NestJS Lifecycle Hook: Invoked when the application or module is destroyed.
   * Unregisters IPC handlers and gracefully shuts down the virtual machine.
   */
  async onModuleDestroy(): Promise<void> {
    this.controller.unregisterIpc(this.ipcTarget ?? undefined)
    await this.service.onModuleDestroy()
  }
}

