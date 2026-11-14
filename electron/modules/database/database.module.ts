/**
 * @file database.module.ts
 * @description NestJS-style TypeORM DatabaseModule encapsulating DataSource & repository access.
 */

import type { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm'
import type { OnModuleDestroy, OnModuleInit } from '../code-test/common/lifecycle.ts'
import { DatabaseService } from './services/database.service.ts'
import type { DatabaseModuleOptions, DatabaseStatusDto } from './types/index.ts'

export class DatabaseModule implements OnModuleInit, OnModuleDestroy {
  private readonly databaseService: DatabaseService

  constructor(options: DatabaseModuleOptions = {}) {
    this.databaseService = new DatabaseService(options)
  }

  static forRoot(options: DatabaseModuleOptions = {}): DatabaseModule {
    return new DatabaseModule(options)
  }

  async onModuleInit(): Promise<void> {
    await this.databaseService.onModuleInit()
  }

  async onModuleDestroy(): Promise<void> {
    await this.databaseService.onModuleDestroy()
  }

  getService(): DatabaseService {
    return this.databaseService
  }

  getDataSource(): DataSource {
    return this.databaseService.getDataSource()
  }

  getRepository<Entity extends ObjectLiteral>(target: EntityTarget<Entity>): Repository<Entity> {
    return this.databaseService.getRepository(target)
  }

  getStatus(): DatabaseStatusDto {
    return this.databaseService.getStatus()
  }
}

