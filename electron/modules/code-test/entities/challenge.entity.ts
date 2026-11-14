/**
 * @file entities/challenge.entity.ts
 * @description TypeORM EntitySchema for coding challenges, starter templates, hints, and saved progress.
 */

import { EntitySchema } from 'typeorm'
import type { CategoryRecord } from './category.entity.ts'
import type { SubmissionRecord } from './submission.entity.ts'
import type { FavoriteRecord } from './favorite.entity.ts'

export type ChallengeDifficulty = 'Easy' | 'Medium' | 'Hard'

export interface ChallengeRecord {
  id: number
  slug: string
  title: string
  description: string
  difficulty: ChallengeDifficulty
  acceptance: string
  tags: string[]
  examples: Array<Record<string, unknown>>
  constraints: string[]
  testCases: Array<Record<string, unknown>>
  initialSolution: string
  initialSolutions: Record<string, string> | null
  solution: string
  hints: string[]
  solved: boolean
  starred: boolean
  categoryId: number
  category?: CategoryRecord | null
  submissions?: SubmissionRecord[]
  favorite?: FavoriteRecord | null
  createdAt: Date
  updatedAt: Date
}

export const ChallengeEntity = new EntitySchema<ChallengeRecord>({
  name: 'Challenge',
  tableName: 'challenges',
  columns: {
    id: {
      type: 'integer',
      primary: true,
      generated: true,
    },
    slug: {
      type: 'varchar',
      length: 200,
      default: '',
    },
    title: {
      type: 'varchar',
      length: 200,
    },
    description: {
      type: 'text',
    },
    difficulty: {
      type: 'varchar',
      length: 16,
      default: 'Easy',
    },
    acceptance: {
      type: 'varchar',
      length: 32,
      default: '50.0%',
    },
    tags: {
      type: 'simple-json',
      nullable: false,
    },
    examples: {
      type: 'simple-json',
      nullable: false,
    },
    constraints: {
      type: 'simple-json',
      nullable: false,
    },
    testCases: {
      type: 'simple-json',
      nullable: false,
    },
    initialSolution: {
      type: 'text',
      default: '',
    },
    initialSolutions: {
      type: 'simple-json',
      nullable: true,
    },
    solution: {
      type: 'text',
      default: '',
    },
    hints: {
      type: 'simple-json',
      nullable: false,
    },
    solved: {
      type: 'boolean',
      default: false,
    },
    starred: {
      type: 'boolean',
      default: false,
    },
    categoryId: {
      type: 'integer',
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
    category: {
      type: 'many-to-one',
      target: 'Category',
      joinColumn: {
        name: 'categoryId',
        referencedColumnName: 'id',
      },
      inverseSide: 'challenges',
      onDelete: 'CASCADE',
    },
    submissions: {
      type: 'one-to-many',
      target: 'Submission',
      inverseSide: 'challenge',
    },
    favorite: {
      type: 'one-to-one',
      target: 'Favorite',
      inverseSide: 'challenge',
    },
  },
})

