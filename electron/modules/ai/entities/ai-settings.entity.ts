/**
 * @file entities/ai-settings.entity.ts
 * @description TypeORM EntitySchema persisting the user's selected AI provider & credentials locally in SQLite.
 */

import { EntitySchema } from 'typeorm'
import type { AiProviderId } from '../../../../src/shared/types/ai.ts'

export interface AiSettingsRecord {
  id: number
  provider: AiProviderId
  modelId: string
  apiKey: string
  baseUrl: string
  providerConfigsJson?: string
  updatedAt: Date
}

export const AiSettingsEntity = new EntitySchema<AiSettingsRecord>({
  name: 'AiSettings',
  tableName: 'ai_settings',
  columns: {
    id: {
      type: 'integer',
      primary: true,
    },
    provider: {
      type: 'varchar',
      length: 32,
      default: 'gateway',
    },
    modelId: {
      type: 'varchar',
      length: 160,
      default: 'anthropic/claude-sonnet-4.5',
    },
    apiKey: {
      type: 'text',
      default: '',
    },
    baseUrl: {
      type: 'varchar',
      length: 300,
      default: '',
    },
    providerConfigsJson: {
      type: 'text',
      default: '{}',
    },
    updatedAt: {
      type: 'datetime',
      updateDate: true,
    },
  },
})

