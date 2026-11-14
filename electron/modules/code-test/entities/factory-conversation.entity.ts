/**
 * @file entities/factory-conversation.entity.ts
 * @description TypeORM EntitySchema for Questions Factory conversations, drafts, and generated outputs.
 */

import { EntitySchema } from 'typeorm'

export interface FactoryConversationRecord {
  id: string
  title: string
  messages: Array<Record<string, unknown>>
  draft: Record<string, unknown> | null
  generatedQuestions: Array<Record<string, unknown>>
  generatedTarget: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

export const FactoryConversationEntity = new EntitySchema<FactoryConversationRecord>({
  name: 'FactoryConversation',
  tableName: 'factory_conversations',
  columns: {
    id: {
      type: 'varchar',
      length: 96,
      primary: true,
    },
    title: {
      type: 'varchar',
      length: 200,
    },
    messages: {
      type: 'simple-json',
      nullable: false,
    },
    draft: {
      type: 'simple-json',
      nullable: true,
    },
    generatedQuestions: {
      type: 'simple-json',
      nullable: false,
    },
    generatedTarget: {
      type: 'simple-json',
      nullable: true,
    },
    createdAt: {
      type: 'datetime',
      createDate: true,
    },
    updatedAt: {
      type: 'datetime',
      updateDate: true,
    },
  },
})

