/**
 * @file entities/user-profile.entity.ts
 * @description TypeORM EntitySchema for the local user profile created during onboarding.
 */

import { EntitySchema } from 'typeorm'

export interface UserProfileRecord {
  id: number
  displayName: string
  username: string
  bio: string
  avatarId: string
  createdAt: Date
  updatedAt: Date
}

export const UserProfileEntity = new EntitySchema<UserProfileRecord>({
  name: 'UserProfile',
  tableName: 'user_profile',
  columns: {
    id: {
      type: 'integer',
      primary: true,
    },
    displayName: {
      type: 'varchar',
      length: 100,
    },
    username: {
      type: 'varchar',
      length: 64,
    },
    bio: {
      type: 'varchar',
      length: 240,
      default: '',
    },
    avatarId: {
      type: 'varchar',
      length: 64,
      default: 'cat',
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
