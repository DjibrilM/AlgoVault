/**
 * @file entities/favorite.entity.ts
 * @description TypeORM EntitySchema for favorited challenges (1:1 relation with Challenge).
 */

import { EntitySchema } from 'typeorm'
import type { ChallengeRecord } from './challenge.entity.ts'

export interface FavoriteRecord {
  id: number
  challengeId: number
  challenge?: ChallengeRecord | null
  createdAt: Date
  updatedAt: Date
}

export const FavoriteEntity = new EntitySchema<FavoriteRecord>({
  name: 'Favorite',
  tableName: 'favorites',
  columns: {
    id: {
      type: 'integer',
      primary: true,
      generated: true,
    },
    challengeId: {
      type: 'integer',
      unique: true,
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
      type: 'one-to-one',
      target: 'Challenge',
      joinColumn: {
        name: 'challengeId',
        referencedColumnName: 'id',
      },
      inverseSide: 'favorite',
      onDelete: 'CASCADE',
    },
  },
})

