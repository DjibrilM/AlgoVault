import { CategoryEntity } from './category.entity.ts'
import { ChallengeEntity } from './challenge.entity.ts'
import { SubmissionEntity } from './submission.entity.ts'
import { FavoriteEntity } from './favorite.entity.ts'
import { FactoryConversationEntity } from './factory-conversation.entity.ts'

export { CategoryEntity, type CategoryRecord } from './category.entity.ts'
export {
  ChallengeEntity,
  type ChallengeRecord,
  type ChallengeDifficulty,
} from './challenge.entity.ts'
export { SubmissionEntity, type SubmissionRecord } from './submission.entity.ts'
export { FavoriteEntity, type FavoriteRecord } from './favorite.entity.ts'
export {
  FactoryConversationEntity,
  type FactoryConversationRecord,
} from './factory-conversation.entity.ts'

export const CODE_TEST_ENTITIES = [
  CategoryEntity,
  ChallengeEntity,
  SubmissionEntity,
  FavoriteEntity,
  FactoryConversationEntity,
]
