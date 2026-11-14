/**
 * @file database.service.ts
 * @description NestJS-style Provider managing the TypeORM DataSource lifecycle (sql.js SQLite).
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { DataSource, type EntityTarget, type ObjectLiteral, type Repository } from 'typeorm'
import type { OnModuleDestroy, OnModuleInit } from '../../code-test/common/lifecycle.ts'
import type { DatabaseModuleOptions, DatabaseStatusDto, IDatabaseService } from '../types/index.ts'

/**
 * Resolves the default SQLite database file path in the user's app data directory.
 */
export function resolveDefaultDbPath(): string {
  const baseDir =
    process.env.ALGOVALUT_DATA_DIR ||
    process.env.ALGO_VAULT_DATA_DIR ||
    path.join(os.homedir(), '.algovault')
  return path.join(baseDir, 'algovault.sqlite')
}

export class DatabaseService implements IDatabaseService, OnModuleInit, OnModuleDestroy {
  private dataSource: DataSource | null = null
  private initPromise: Promise<DataSource> | null = null
  private readonly options: DatabaseModuleOptions
  private readonly dbPath: string

  constructor(options: DatabaseModuleOptions = {}) {
    this.options = options
    this.dbPath = options.dbPath ?? resolveDefaultDbPath()
  }

  async onModuleInit(): Promise<void> {
    await this.initialize()
  }

  async onModuleDestroy(): Promise<void> {
    await this.destroy()
  }

  async initialize(): Promise<DataSource> {
    if (this.dataSource?.isInitialized) {
      return this.dataSource
    }

    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = (async () => {
      const isInMemory = this.dbPath === ':memory:'
      if (!isInMemory) {
        fs.mkdirSync(path.dirname(this.dbPath), { recursive: true })
      }

      const ds = new DataSource({
        type: 'sqljs',
        location: isInMemory ? undefined : this.dbPath,
        autoSave: isInMemory ? false : (this.options.autoSave ?? true),
        synchronize: this.options.synchronize ?? true,
        logging: this.options.logging ?? false,
        entities: this.options.entities ?? [],
      })

      await ds.initialize()
      this.dataSource = ds
      return ds
    })()

    try {
      return await this.initPromise
    } finally {
      this.initPromise = null
    }
  }

  async destroy(): Promise<void> {
    if (!this.dataSource) return
    const ds = this.dataSource
    this.dataSource = null
    if (ds.isInitialized) {
      await ds.destroy()
    }
  }

  getDataSource(): DataSource {
    if (!this.dataSource || !this.dataSource.isInitialized) {
      throw new Error('DatabaseService is not initialized. Call initialize() first.')
    }
    return this.dataSource
  }

  getRepository<Entity extends ObjectLiteral>(target: EntityTarget<Entity>): Repository<Entity> {
    return this.getDataSource().getRepository(target)
  }

  getStatus(): DatabaseStatusDto {
    return {
      initialized: Boolean(this.dataSource?.isInitialized),
      dbPath: this.dbPath,
      entityCount: this.options.entities?.length ?? 0,
    }
  }
}

