/**
 * @file entities/todo.entity.ts
 * @description TypeORM EntitySchema for persistent study to-dos and practice queue items.
 */

import { EntitySchema } from 'typeorm'
import type { ChallengeRecord } from './challenge.entity.ts'

export type TodoImportance = 'low' | 'medium' | 'high' | 'critical'

export interface TodoRecord {
  id: number
  title: string
  notes: string | null
  importance: TodoImportance
  deadline: string | null
  challengeId: number | null
  completed: boolean
  challenge?: ChallengeRecord | null
  createdAt: Date
  updatedAt: Date
}

export const TodoEntity = new EntitySchema<TodoRecord>({
  name: 'Todo',
  tableName: 'todos',
  columns: {
    id: {
      type: 'integer',
      primary: true,
      generated: true,
    },
    title: {
      type: 'varchar',
      length: 300,
    },
    notes: {
      type: 'text',
      nullable: true,
      default: null,
    },
    importance: {
      type: 'varchar',
      length: 20,
      default: 'medium',
    },
    deadline: {
      type: 'varchar',
      length: 40,
      nullable: true,
      default: null,
    },
    challengeId: {
      type: 'integer',
      nullable: true,
      default: null,
    },
    completed: {
      type: 'boolean',
      default: false,
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
  relations: {
    challenge: {
      type: 'many-to-one',
      target: 'Challenge',
      joinColumn: {
        name: 'challengeId',
        referencedColumnName: 'id',
      },
      nullable: true,
      onDelete: 'SET NULL',
    },
  },
})
