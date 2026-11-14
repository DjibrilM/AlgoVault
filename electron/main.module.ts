/**
 * @file main.module.ts
 * @description NestJS-style Root Application Module (analogous to Nest's AppModule / MainModule).
 *
 * Serves as the central composition root for the Electron Main process:
 * - Aggregates and orchestrates all feature modules (e.g. `CodeTestModule`).
 * - Coordinates lifecycle initialization (`OnModuleInit`) and cleanup (`OnModuleDestroy`).
 * - Provides the `MainModule.bootstrap()` factory method to boot the application container.
 */

import type { IpcMain } from 'electron'
import {
  CodeTestModule,
  CODE_TEST_ENTITIES,
  seedDefaultCategories,
  seedDefaultChallenges,
  migrateSubmissionsNonUnique,
  migrateChallengesCategoryNonUnique,
  type CodeTestModuleOptions,
} from './modules/code-test/index.ts'
import { DatabaseModule, type DatabaseModuleOptions } from './modules/database/index.ts'
import type { OnModuleInit, OnModuleDestroy } from './modules/code-test/common/lifecycle.ts'

export interface MainModuleOptions {
  /** Custom ipcMain instance (useful for testing or custom dispatchers) */
  ipcMain?: IpcMain
  /** Configuration overrides specifically for CodeTestModule */
  codeTest?: CodeTestModuleOptions
  /** Configuration overrides specifically for DatabaseModule */
  database?: DatabaseModuleOptions
}

/**
 * NestJS Root Module.
 *
 * Encapsulates:
 * - `imports`: [DatabaseModule, CodeTestModule]
 */
export class MainModule implements OnModuleInit, OnModuleDestroy {
  /** Core Module: TypeORM SQLite persistence */
  readonly databaseModule: DatabaseModule
  /** Feature Module: Code execution and SandboxVm management */
  readonly codeTestModule: CodeTestModule

  constructor(options: MainModuleOptions = {}) {
    this.databaseModule = DatabaseModule.forRoot({
      entities: [...CODE_TEST_ENTITIES],
      ...options.database,
    })

    // Imports: instantiate feature modules with dependency options
    this.codeTestModule = new CodeTestModule({
      ipcMain: options.ipcMain,
      ...options.codeTest,
    })
  }

  /**
   * NestJS-style application bootstrap factory (similar to `NestFactory.create(MainModule)`).
   *
   * Instantiates the root container and triggers the `onModuleInit` lifecycle on all modules.
   *
   * @param options Optional root module configuration options.
   * @returns Bootstrapped MainModule instance ready to handle IPC requests.
   */
  static async bootstrap(options?: MainModuleOptions): Promise<MainModule> {
    const mainModule = new MainModule(options)
    await mainModule.onModuleInit()
    return mainModule
  }

  /**
   * NestJS Lifecycle Hook: Invoked when the application is initializing.
   * Initializes all imported feature modules.
   */
  async onModuleInit(): Promise<void> {
    await this.databaseModule.onModuleInit()
    const dataSource = this.databaseModule.getDataSource()
    await migrateSubmissionsNonUnique(dataSource)
    await migrateChallengesCategoryNonUnique(dataSource)
    await seedDefaultCategories(dataSource)
    await seedDefaultChallenges(dataSource)
    this.codeTestModule.service.setDataSource(dataSource)
    await this.codeTestModule.onModuleInit()
  }

  /**
   * NestJS Lifecycle Hook: Invoked when the application is shutting down.
   * Gracefully tears down all imported feature modules in reverse order.
   */
  async onModuleDestroy(): Promise<void> {
    await this.codeTestModule.onModuleDestroy()
    await this.databaseModule.onModuleDestroy()
  }
}

