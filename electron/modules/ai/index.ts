import { AiSettingsEntity, type AiSettingsRecord } from './entities/ai-settings.entity.ts'

export { AiModule } from './ai.module.ts'
export { AiController } from './controllers/ai.controller.ts'
export { AiService } from './services/ai.service.ts'
export { ModelFactoryService } from './services/model-factory.service.ts'
export { AiSettingsEntity, type AiSettingsRecord }
export { createMasterAgent } from './agents/master.agent.ts'
export { createCatalogAnalystSubagent, createCatalogAnalystTool } from './agents/catalog-analyst.subagent.ts'
export {
  createChallengeArchitectSubagent,
  createChallengeArchitectTool,
  mapChallengeSetToPreviewItems,
} from './agents/challenge-architect.subagent.ts'
export {
  auditArchitectedChallengeSet,
  createChallengeVerifierSubagent,
  createVerifyChallengeSetTool,
} from './agents/challenge-verifier.agent.ts'
export * from './types/index.ts'

export const AI_ENTITIES = [AiSettingsEntity]

