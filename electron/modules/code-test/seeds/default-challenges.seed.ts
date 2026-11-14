/**
 * @file seeds/default-challenges.seed.ts
 * @description Idempotent seeder for initial coding challenges linked 1:1 to default categories.
 */

import type { DataSource } from 'typeorm'
import { EASY_PROBLEMS } from '../../../../src/shared/data/problems/easyProblems.ts'
import { MEDIUM_HARD_PROBLEMS } from '../../../../src/shared/data/problems/mediumHardProblems.ts'
import { CategoryEntity } from '../entities/category.entity.ts'
import { ChallengeEntity, type ChallengeRecord } from '../entities/challenge.entity.ts'

/**
 * Maps each initial problem ID to a distinct default category title (1:1 relation).
 */
const PROBLEM_TO_CATEGORY_TITLE: Record<number, string> = {
  1: 'Arrays & Hashing',
  42: 'Two Pointers',
  3: 'Sliding Window',
  20: 'Stack & Monotonic Stack',
  146: 'Linked Lists',
  70: '1-D Dynamic Programming',
  322: '2-D Dynamic Programming',
  100: 'Math & Number Theory',
  101: 'Bit Manipulation',
  102: 'Backtracking',
  9: 'Strings & Pattern Matching',
}

/**
 * Seeds initial challenges into the database if the `challenges` table is empty.
 * Each challenge is linked 1:1 to its category and starts with an empty `solution` and `solved = false`.
 */
export async function seedDefaultChallenges(
  dataSource: DataSource
): Promise<ChallengeRecord[]> {
  const challengeRepo = dataSource.getRepository(ChallengeEntity)
  const existingCount = await challengeRepo.count()
  if (existingCount > 0) {
    // Reconcile legacy seeds where `starred = 1` was written without a `favorites` row
    await dataSource.query(`
      UPDATE challenges
      SET starred = 0
      WHERE starred = 1
        AND id NOT IN (SELECT challengeId FROM favorites)
    `)
    return challengeRepo.find({ order: { id: 'ASC' } })
  }

  const categoryRepo = dataSource.getRepository(CategoryEntity)
  const categories = await categoryRepo.find()
  const categoryByTitle = new Map(categories.map((c) => [c.title, c]))

  const allProblems = [...EASY_PROBLEMS, ...MEDIUM_HARD_PROBLEMS]
  const entities: ChallengeRecord[] = []

  for (const problem of allProblems) {
    const targetTitle = PROBLEM_TO_CATEGORY_TITLE[problem.id]
    if (!targetTitle) continue
    const category = categoryByTitle.get(targetTitle)
    if (!category) continue

    entities.push(
      challengeRepo.create({
        slug: problem.slug,
        title: problem.title,
        description: problem.description,
        difficulty: problem.difficulty,
        acceptance: problem.acceptance,
        tags: problem.tags,
        examples: problem.examples as unknown as Array<Record<string, unknown>>,
        constraints: problem.constraints,
        testCases: problem.testCases as unknown as Array<Record<string, unknown>>,
        initialSolution: problem.codeTemplates.typescript ?? '',
        initialSolutions: problem.codeTemplates,
        solution: '',
        hints: problem.hints,
        solved: false,
        starred: false,
        categoryId: category.id,
      })
    )
  }

  if (entities.length === 0) return []
  return challengeRepo.save(entities)
}

/**
 * Ensures an existing SQLite `submissions` table from an earlier schema version
 * does not retain a UNIQUE constraint on `challengeId`, preserving all existing rows.
 */
export async function migrateSubmissionsNonUnique(dataSource: DataSource): Promise<void> {
  const rows = (await dataSource.query(
    `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'submissions'`
  )) as Array<{ sql?: string }>

  const tableSql = rows?.[0]?.sql ?? ''
  if (!/UNIQUE\s*\(\s*"?challengeId"?\s*\)/i.test(tableSql)) {
    return
  }

  await dataSource.transaction(async (manager) => {
    await manager.query(`
      CREATE TABLE "submissions_migrated" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "challengeId" integer NOT NULL,
        "lang" varchar(32) NOT NULL,
        "code" text NOT NULL,
        "status" varchar(32) NOT NULL DEFAULT ('passed'),
        "verdict" varchar(64) NOT NULL,
        "passedCases" integer NOT NULL DEFAULT (0),
        "totalCases" integer NOT NULL DEFAULT (0),
        "timeMs" integer NOT NULL DEFAULT (0),
        "cpuMs" integer NOT NULL DEFAULT (0),
        "memoryKb" integer NOT NULL DEFAULT (0),
        "output" text,
        "compileError" text,
        "failedCase" text,
        "testCaseResults" text,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "FK_submissions_challenge" FOREIGN KEY ("challengeId") REFERENCES "challenges" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `)

    await manager.query(`
      INSERT INTO "submissions_migrated" (
        "id", "challengeId", "lang", "code", "status", "verdict",
        "passedCases", "totalCases", "timeMs", "cpuMs", "memoryKb",
        "output", "compileError", "failedCase", "testCaseResults",
        "createdAt", "updatedAt"
      )
      SELECT
        "id", "challengeId", "lang", "code", "status", "verdict",
        "passedCases", "totalCases", "timeMs", "cpuMs", "memoryKb",
        "output", "compileError", "failedCase", "testCaseResults",
        "createdAt", "updatedAt"
      FROM "submissions"
    `)

    await manager.query(`DROP TABLE "submissions"`)
    await manager.query(`ALTER TABLE "submissions_migrated" RENAME TO "submissions"`)
  })
}

/**
 * Ensures an existing SQLite `challenges` table from an earlier 1:1 schema version
 * does not retain a UNIQUE constraint on `categoryId`, preserving all existing rows.
 */
export async function migrateChallengesCategoryNonUnique(dataSource: DataSource): Promise<void> {
  const rows = (await dataSource.query(
    `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'challenges'`
  )) as Array<{ sql?: string }>

  const tableSql = rows?.[0]?.sql ?? ''
  if (!/UNIQUE\s*\(\s*"?categoryId"?\s*\)|"categoryId"[^,)]*\bUNIQUE\b/i.test(tableSql)) {
    return
  }

  const prevFk = (await dataSource.query(`PRAGMA foreign_keys`)) as Array<{ foreign_keys?: number }>
  const hadFk = Boolean(prevFk?.[0]?.foreign_keys)
  if (hadFk) {
    await dataSource.query(`PRAGMA foreign_keys = OFF`)
  }

  try {
    await dataSource.transaction(async (manager) => {
      await manager.query(`
        CREATE TABLE "challenges_migrated" (
          "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
          "slug" varchar(200) NOT NULL DEFAULT (''),
          "title" varchar(200) NOT NULL,
          "description" text NOT NULL,
          "difficulty" varchar(16) NOT NULL DEFAULT ('Easy'),
          "acceptance" varchar(32) NOT NULL DEFAULT ('50.0%'),
          "tags" text NOT NULL,
          "examples" text NOT NULL,
          "constraints" text NOT NULL,
          "testCases" text NOT NULL,
          "initialSolution" text NOT NULL DEFAULT (''),
          "initialSolutions" text,
          "solution" text NOT NULL DEFAULT (''),
          "hints" text NOT NULL,
          "solved" boolean NOT NULL DEFAULT (0),
          "starred" boolean NOT NULL DEFAULT (0),
          "categoryId" integer NOT NULL,
          "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
          "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
          CONSTRAINT "FK_challenges_category" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        )
      `)

      await manager.query(`
        INSERT INTO "challenges_migrated" (
          "id", "slug", "title", "description", "difficulty", "acceptance",
          "tags", "examples", "constraints", "testCases", "initialSolution",
          "initialSolutions", "solution", "hints", "solved", "starred",
          "categoryId", "createdAt", "updatedAt"
        )
        SELECT
          "id", "slug", "title", "description", "difficulty", "acceptance",
          "tags", "examples", "constraints", "testCases", "initialSolution",
          "initialSolutions", "solution", "hints", "solved", "starred",
          "categoryId", "createdAt", "updatedAt"
        FROM "challenges"
      `)

      await manager.query(`DROP TABLE "challenges"`)
      await manager.query(`ALTER TABLE "challenges_migrated" RENAME TO "challenges"`)
    })
  } finally {
    if (hadFk) {
      await dataSource.query(`PRAGMA foreign_keys = ON`)
    }
  }
}

