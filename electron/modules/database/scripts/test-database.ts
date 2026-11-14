/**
 * @file test-database.ts
 * @description Standalone test verifying TypeORM DatabaseModule and Category / Challenge / Submission 1:1 schemas.
 *
 * Run:
 *   node electron/modules/database/scripts/test-database.ts
 */

import assert from 'node:assert/strict'
import { DatabaseModule } from '../index.ts'
import {
  CODE_TEST_ENTITIES,
  ChallengeEntity,
  SubmissionEntity,
  FavoriteEntity,
} from '../../code-test/entities/index.ts'
import {
  DEFAULT_CATEGORIES,
  seedDefaultCategories,
  seedDefaultChallenges,
} from '../../code-test/seeds/index.ts'

async function main() {
  console.log('Testing TypeORM DatabaseModule schemas...')

  const dbModule = DatabaseModule.forRoot({
    dbPath: ':memory:',
    entities: [...CODE_TEST_ENTITIES],
  })

  await dbModule.onModuleInit()

  const status = dbModule.getStatus()
  assert.equal(status.initialized, true, 'DatabaseModule should be initialized')
  assert.equal(status.entityCount, 5, 'Should register Category, Challenge, Submission, Favorite, and FactoryConversation entities')
  console.log('1. Initialized TypeORM DataSource:', status)

  const challengeRepo = dbModule.getRepository(ChallengeEntity)
  const submissionRepo = dbModule.getRepository(SubmissionEntity)

  // 1. Seed initial 20 famous categories on first install
  const seededCategories = await seedDefaultCategories(dbModule.getDataSource())
  assert.equal(
    seededCategories.length,
    20,
    'Should seed all 20 default famous categories on an empty database'
  )
  assert.equal(seededCategories[0].title, DEFAULT_CATEGORIES[0].title)

  // Verify idempotency: calling seedDefaultCategories a second time must not duplicate rows
  const reSeededCategories = await seedDefaultCategories(dbModule.getDataSource())
  assert.equal(
    reSeededCategories.length,
    20,
    'Subsequent startup seed should remain at 20 categories without duplicates'
  )
  console.log(`2. Seeded ${seededCategories.length} famous categories on first install`)

  // 2. Seed initial challenges linked 1:1 to categories
  const seededChallenges = await seedDefaultChallenges(dbModule.getDataSource())
  assert.ok(seededChallenges.length >= 10, 'Should seed initial challenges linked 1:1 to categories')
  assert.equal(seededChallenges[0].solution, '', 'Seeded challenge initial user solution should be empty')
  assert.equal(seededChallenges[0].solved, false, 'Seeded challenge should start unsolved')
  console.log(`2b. Seeded ${seededChallenges.length} initial challenges`)

  // 3. Create Challenge with 1:1 relation to Category, starter solution, empty solution, hints, and difficulty
  const challenge = await challengeRepo.save(
    challengeRepo.create({
      slug: 'palindrome-number-test',
      title: 'Palindrome Number',
      description:
        '### Palindrome Number\n\nGiven an integer `x`, return `true` if `x` is a palindrome, and `false` otherwise.',
      difficulty: 'Easy',
      acceptance: '54.2%',
      tags: ['Math'],
      examples: [{ id: 1, input: 'x = 121', output: 'true' }],
      constraints: ['-2^31 <= x <= 2^31 - 1'],
      testCases: [{ id: 1, input: 'x = 121', expected: 'true' }],
      initialSolution: 'function isPalindrome(x: number): boolean {\n\n}',
      initialSolutions: {
        typescript: 'function isPalindrome(x: number): boolean {\n\n}',
        python: 'def is_palindrome(x: int) -> bool:\n    pass',
      },
      solution: '',
      hints: ['Reverse half of the number to avoid integer overflow.'],
      solved: false,
      starred: false,
      categoryId: seededCategories[4].id,
    })
  )
  assert.equal(challenge.solution, '', 'Initial user solution should be empty')
  assert.equal(challenge.difficulty, 'Easy')
  console.log('3. Created Challenge linked 1:1 to Category:', challenge.title)

  // 3. Save user progress onto Challenge
  const updatedSolution =
    'function isPalindrome(x: number): boolean {\n  if (x < 0) return false;\n  const s = String(x);\n  return s === s.split("").reverse().join("");\n}'
  await challengeRepo.update(
    { id: challenge.id },
    { solution: updatedSolution, solved: true }
  )

  // 4. Create Submission with 1:1 relation to Challenge
  const submission = await submissionRepo.save(
    submissionRepo.create({
      challengeId: challenge.id,
      lang: 'typescript',
      code: updatedSolution,
      status: 'passed',
      verdict: 'Accepted',
      passedCases: 3,
      totalCases: 3,
      timeMs: 12,
      cpuMs: 9,
      memoryKb: 4120,
      output: 'All 3 test cases passed.',
      compileError: null,
      failedCase: null,
      testCaseResults: [
        { id: 1, passed: true, timeMs: 4 },
        { id: 2, passed: true, timeMs: 4 },
        { id: 3, passed: true, timeMs: 4 },
      ],
    })
  )
  assert.equal(submission.verdict, 'Accepted')
  assert.equal(submission.memoryKb, 4120)
  console.log('4. Created Submission linked 1:1 to Challenge')

  // 5. Verify relations and multiple submissions per challenge
  await submissionRepo.save(
    submissionRepo.create({
      challengeId: challenge.id,
      lang: 'typescript',
      code: updatedSolution,
      status: 'failed',
      verdict: 'Wrong Answer',
      passedCases: 2,
      totalCases: 3,
      timeMs: 10,
      cpuMs: 8,
      memoryKb: 4000,
      output: 'Wrong Answer on case 3.',
      compileError: null,
      failedCase: null,
      testCaseResults: [],
    })
  )

  const favoriteRepo = dbModule.getRepository(FavoriteEntity)
  await favoriteRepo.save(favoriteRepo.create({ challengeId: challenge.id }))

  const loadedChallenge = await challengeRepo.findOne({
    where: { id: challenge.id },
    relations: { category: true, submissions: true, favorite: true },
  })
  assert.equal(loadedChallenge?.category?.title, seededCategories[4].title)
  assert.equal(loadedChallenge?.submissions?.length, 2)
  assert.equal(loadedChallenge?.favorite?.challengeId, challenge.id)
  assert.equal(loadedChallenge?.solved, true)
  console.log('5. Verified relations (Category <-> Challenge <-> Submissions[] / Favorite)')

  await dbModule.onModuleDestroy()
  assert.equal(dbModule.getStatus().initialized, false)
  console.log('6. Verified graceful destroy()')

  console.log('\nAll TypeORM schema tests passed!')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
