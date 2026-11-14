/**
 * @file entities/category.entity.ts
 * @description TypeORM EntitySchema for challenge categories.
 */

import { EntitySchema } from 'typeorm'
import type { ChallengeRecord } from './challenge.entity.ts'

export interface CategoryRecord {
  id: number
  title: string
  description: string
  challenges?: ChallengeRecord[]
  createdAt: Date
  updatedAt: Date
}

export const CategoryEntity = new EntitySchema<CategoryRecord>({
  name: 'Category',
  tableName: 'categories',
  columns: {
    id: {
      type: 'integer',
      primary: true,
      generated: true,
    },
    title: {
      type: 'varchar',
      length: 128,
    },
    description: {
      type: 'text',
      default: '',
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
    challenges: {
      type: 'one-to-many',
      target: 'Challenge',
      inverseSide: 'category',
    },
  },
})

