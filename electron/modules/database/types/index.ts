/**
 * @file database/types/index.ts
 * @description Type contracts for the TypeORM DatabaseModule.
 */

import type { DataSource, EntitySchema, EntityTarget, ObjectLiteral, Repository } from 'typeorm'

export interface DatabaseModuleOptions {
  /** Path to the SQLite database file on disk (omit or pass ':memory:' for in-memory mode) */
  dbPath?: string
  /** EntitySchema definitions contributed by feature modules */
  entities?: EntitySchema<any>[]
  /** Whether TypeORM should auto-create/sync schema on initialization (defaults to true) */
  synchronize?: boolean
  /** Enable TypeORM SQL query logging (defaults to false) */
  logging?: boolean
  /** Persist changes automatically to disk when using sql.js (defaults to true when dbPath is set) */
  autoSave?: boolean
}

export interface DatabaseStatusDto {
  initialized: boolean
  dbPath: string
  entityCount: number
}

export interface IDatabaseService {
  initialize(): Promise<DataSource>
  destroy(): Promise<void>
  getDataSource(): DataSource
  getRepository<Entity extends ObjectLiteral>(target: EntityTarget<Entity>): Repository<Entity>
  getStatus(): DatabaseStatusDto
}

