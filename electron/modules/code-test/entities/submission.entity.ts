/**
 * @file entities/submission.entity.ts
 * @description TypeORM EntitySchema for challenge code submissions and compute resource telemetry.
 */

import { EntitySchema } from 'typeorm'
import type { ChallengeRecord } from './challenge.entity.ts'

export interface SubmissionRecord {
  id: number
  challengeId: number
  challenge?: ChallengeRecord | null
  lang: string
  code: string
  status: string
  verdict: string
  passedCases: number
  totalCases: number
  timeMs: number
  cpuMs: number
  memoryKb: number
  output: string | null
  compileError: string | null
  failedCase: Record<string, unknown> | null
  testCaseResults: Array<Record<string, unknown>> | null
  createdAt: Date
  updatedAt: Date
}

export const SubmissionEntity = new EntitySchema<SubmissionRecord>({
  name: 'Submission',
  tableName: 'submissions',
  columns: {
    id: {
      type: 'integer',
      primary: true,
      generated: true,
    },
    challengeId: {
      type: 'integer',
    },
    lang: {
      type: 'varchar',
      length: 32,
    },
    code: {
      type: 'text',
    },
    status: {
      type: 'varchar',
      length: 32,
      default: 'passed',
    },
    verdict: {
      type: 'varchar',
      length: 64,
    },
    passedCases: {
      type: 'integer',
      default: 0,
    },
    totalCases: {
      type: 'integer',
      default: 0,
    },
    timeMs: {
      type: 'integer',
      default: 0,
    },
    cpuMs: {
      type: 'integer',
      default: 0,
    },
    memoryKb: {
      type: 'integer',
      default: 0,
    },
    output: {
      type: 'text',
      nullable: true,
    },
    compileError: {
      type: 'text',
      nullable: true,
    },
    failedCase: {
      type: 'simple-json',
      nullable: true,
    },
    testCaseResults: {
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
  relations: {
    challenge: {
      type: 'many-to-one',
      target: 'Challenge',
      joinColumn: {
        name: 'challengeId',
        referencedColumnName: 'id',
      },
      inverseSide: 'submissions',
      onDelete: 'CASCADE',
    },
  },
})
