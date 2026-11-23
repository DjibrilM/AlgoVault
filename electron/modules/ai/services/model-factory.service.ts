/**
 * @file services/model-factory.service.ts
 * @description Resolves Vercel AI SDK LanguageModel instances across AI Gateway,
 * OpenAI, Anthropic, Google Gemini, and local OpenAI-compatible servers (LM Studio / Ollama).
 */

import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI, google } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createGateway, type LanguageModel } from 'ai'
import type { DataSource } from 'typeorm'
import {
  AI_MODEL_PRESETS,
  AI_PROVIDER_DEFAULTS,
  type AiModelOptionDto,
  type AiProviderId,
  type AiProviderStatusDto,
  type SaveAiConfigDto,
} from '../../../../src/shared/types/ai.ts'
import { AiSettingsEntity, type AiSettingsRecord } from '../entities/ai-settings.entity.ts'

const SINGLETON_SETTINGS_ID = 1

type StoredProviderConfigs = Partial<
  Record<AiProviderId, { apiKey?: string; baseUrl?: string }>
>

function parseProviderConfigs(raw?: string | null): StoredProviderConfigs {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as StoredProviderConfigs
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function readStoredProviderEntry(
  stored: AiSettingsRecord | null | undefined,
  provider: AiProviderId
): { apiKey: string; baseUrl: string } {
  if (!stored) return { apiKey: '', baseUrl: '' }
  const map = parseProviderConfigs(stored.providerConfigsJson)
  const entry = map[provider]
  if (entry) {
    return {
      apiKey: entry.apiKey?.trim() ?? '',
      baseUrl: entry.baseUrl?.trim() ?? '',
    }
  }
  if (stored.provider === provider) {
    return {
      apiKey: stored.apiKey.trim(),
      baseUrl: stored.baseUrl.trim(),
    }
  }
  return { apiKey: '', baseUrl: '' }
}

const ENV_KEY_BY_PROVIDER: Record<AiProviderId, string | undefined> = {
  gateway: 'AI_GATEWAY_API_KEY',
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  google: 'GOOGLE_GENERATIVE_AI_API_KEY',
  'openai-compatible': 'OPENAI_COMPATIBLE_API_KEY',
}

export interface ResolvedModelBinding {
  model: LanguageModel
  status: AiProviderStatusDto
}

export function isGoogleApiKey(key?: string): boolean {
  return Boolean(key && key.trim().startsWith('AIza'))
}

function syncGoogleEnvApiKey(apiKey: string): void {
  const trimmed = apiKey.trim()
  if (trimmed) {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = trimmed
  } else {
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY
  }
}

const DIRECT_PROVIDER_PREFIXES: Partial<Record<AiProviderId, string[]>> = {
  google: ['google/', 'models/'],
  openai: ['openai/'],
  anthropic: ['anthropic/'],
}

export function normalizeProviderModelId(provider: AiProviderId, rawModelId: string): string {
  let normalized = rawModelId.trim()
  const fallback = AI_PROVIDER_DEFAULTS[provider].modelId
  if (!normalized) return fallback

  const prefixes = DIRECT_PROVIDER_PREFIXES[provider]
  if (!prefixes) return normalized

  for (const prefix of prefixes) {
    if (normalized.startsWith(prefix)) {
      normalized = normalized.slice(prefix.length)
      break
    }
  }

  if (!normalized || normalized.includes('/')) {
    return fallback
  }

  return normalized
}

export function maskSecret(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.length <= 8) return '••••••••'
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`
}

function getEnvApiKey(provider: AiProviderId): string {
  if (provider === 'google') {
    return (
      process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
      process.env.GEMINI_API_KEY?.trim() ||
      process.env.GOOGLE_API_KEY?.trim() ||
      ''
    )
  }
  const envName = ENV_KEY_BY_PROVIDER[provider]
  return envName ? (process.env[envName]?.trim() ?? '') : ''
}

function getEnvBaseUrl(provider: AiProviderId): string {
  if (provider === 'openai-compatible') {
    return (
      process.env.OPENAI_COMPATIBLE_BASE_URL?.trim() ||
      process.env.LMSTUDIO_BASE_URL?.trim() ||
      process.env.OLLAMA_BASE_URL?.trim() ||
      ''
    )
  }
  return ''
}

function detectEnvConfiguredProvider(): AiProviderId | null {
  if (getEnvApiKey('google')) return 'google'
  if (process.env.AI_GATEWAY_API_KEY?.trim()) return 'gateway'
  if (process.env.OPENAI_API_KEY?.trim()) return 'openai'
  if (process.env.ANTHROPIC_API_KEY?.trim()) return 'anthropic'
  if (
    process.env.OPENAI_COMPATIBLE_BASE_URL?.trim() ||
    process.env.LMSTUDIO_BASE_URL?.trim() ||
    process.env.OLLAMA_BASE_URL?.trim()
  ) {
    return 'openai-compatible'
  }
  return null
}

/**
 * Loads provider credentials from SQLite settings or environment variables
 * and constructs the appropriate Vercel AI SDK LanguageModel instance.
 */
export class ModelFactoryService {
  private dataSource: DataSource | null = null

  setDataSource(dataSource: DataSource | null): void {
    this.dataSource = dataSource
  }

  private async readStoredSettings() {
    if (!this.dataSource || !this.dataSource.isInitialized) return null
    const repo = this.dataSource.getRepository(AiSettingsEntity)
    return repo.findOne({ where: { id: SINGLETON_SETTINGS_ID } })
  }

  async getEffectiveConfig(override?: SaveAiConfigDto): Promise<{
    provider: AiProviderId
    modelId: string
    apiKey: string
    baseUrl: string
    source: AiProviderStatusDto['source']
  }> {
    const stored = await this.readStoredSettings()

    if (override) {
      let provider = override.provider
      let defaults = AI_PROVIDER_DEFAULTS[provider]
      let savedEntry = readStoredProviderEntry(stored, provider)
      const apiKey = override.clearApiKey
        ? ''
        : override.apiKey !== undefined
          ? override.apiKey.trim()
          : savedEntry.apiKey || getEnvApiKey(provider)

      const hasSettingsKey = Boolean(override.apiKey?.trim() || savedEntry.apiKey)
      if (provider === 'gateway' && isGoogleApiKey(apiKey)) {
        provider = 'google'
        defaults = AI_PROVIDER_DEFAULTS.google
        savedEntry = readStoredProviderEntry(stored, 'google')
      }

      const explicitBaseUrl =
        override.baseUrl !== undefined ? override.baseUrl.trim() : savedEntry.baseUrl
      const baseUrl =
        explicitBaseUrl ||
        getEnvBaseUrl(provider) ||
        defaults.baseUrl
      const modelId = normalizeProviderModelId(provider, override.modelId)
      const source: AiProviderStatusDto['source'] =
        apiKey
          ? hasSettingsKey || Boolean(savedEntry.apiKey)
            ? 'settings'
            : 'env'
          : provider === 'openai-compatible' && baseUrl
            ? 'local'
            : 'none'

      return { provider, modelId, apiKey, baseUrl, source }
    }

    if (stored) {
      let provider = stored.provider
      let defaults = AI_PROVIDER_DEFAULTS[provider]
      let savedEntry = readStoredProviderEntry(stored, provider)
      let storedKey = savedEntry.apiKey
      let envKey = getEnvApiKey(provider)
      let rawModelId = stored.modelId

      if (provider === 'gateway') {
        if (isGoogleApiKey(storedKey) || (!storedKey && isGoogleApiKey(envKey))) {
          provider = 'google'
          defaults = AI_PROVIDER_DEFAULTS.google
          savedEntry = readStoredProviderEntry(stored, 'google')
          storedKey = isGoogleApiKey(storedKey) ? storedKey : savedEntry.apiKey
          envKey = getEnvApiKey('google')
        } else if (!storedKey && !envKey) {
          const googleSaved = readStoredProviderEntry(stored, 'google')
          const googleEnvKey = getEnvApiKey('google')
          if (googleSaved.apiKey || googleEnvKey) {
            provider = 'google'
            defaults = AI_PROVIDER_DEFAULTS.google
            savedEntry = googleSaved
            storedKey = googleSaved.apiKey
            envKey = googleEnvKey
            rawModelId = defaults.modelId
          } else {
            const envProvider = detectEnvConfiguredProvider()
            if (envProvider) {
              provider = envProvider
              defaults = AI_PROVIDER_DEFAULTS[envProvider]
              savedEntry = readStoredProviderEntry(stored, envProvider)
              storedKey = savedEntry.apiKey
              envKey = getEnvApiKey(envProvider)
              rawModelId = defaults.modelId
            } else {
              provider = 'google'
              defaults = AI_PROVIDER_DEFAULTS.google
              savedEntry = googleSaved
              storedKey = ''
              envKey = ''
              rawModelId = defaults.modelId
            }
          }
        }
      }

      const apiKey = storedKey || envKey
      const baseUrl =
        savedEntry.baseUrl || getEnvBaseUrl(provider) || defaults.baseUrl
      const modelId = normalizeProviderModelId(provider, rawModelId)

      const source: AiProviderStatusDto['source'] = storedKey
        ? 'settings'
        : envKey
          ? 'env'
          : provider === 'openai-compatible' && baseUrl
            ? 'local'
            : 'none'

      return { provider, modelId, apiKey, baseUrl, source }
    }

    const envProvider = detectEnvConfiguredProvider()
    if (envProvider) {
      const defaults = AI_PROVIDER_DEFAULTS[envProvider]
      const apiKey = getEnvApiKey(envProvider)
      const baseUrl = getEnvBaseUrl(envProvider) || defaults.baseUrl
      const modelId = normalizeProviderModelId(
        envProvider,
        process.env.ALGOVALUT_AI_MODEL?.trim() ||
          process.env.ALGOVAULT_AI_MODEL?.trim() ||
          defaults.modelId
      )
      const source: AiProviderStatusDto['source'] =
        apiKey ? 'env' : 'local'

      return { provider: envProvider, modelId, apiKey, baseUrl, source }
    }

    const fallbackProvider: AiProviderId = 'google'
    const fallbackDefaults = AI_PROVIDER_DEFAULTS[fallbackProvider]
    return {
      provider: fallbackProvider,
      modelId: fallbackDefaults.modelId,
      apiKey: '',
      baseUrl: fallbackDefaults.baseUrl,
      source: 'none',
    }
  }

  async getStatus(override?: SaveAiConfigDto): Promise<AiProviderStatusDto> {
    const resolved = await this.getEffectiveConfig(override)
    const configured =
      resolved.source === 'local'
        ? Boolean(resolved.baseUrl)
        : Boolean(resolved.apiKey)

    return {
      configured,
      source: resolved.source,
      provider: resolved.provider,
      modelId: resolved.modelId,
      baseUrl: resolved.baseUrl,
      hasApiKey: Boolean(resolved.apiKey),
      maskedApiKey: maskSecret(resolved.apiKey),
    }
  }

  async saveConfig(dto: SaveAiConfigDto): Promise<AiProviderStatusDto> {
    if (!this.dataSource || !this.dataSource.isInitialized) {
      throw new Error('Database is not initialized.')
    }

    const effectiveProvider: AiProviderId =
      dto.provider === 'gateway' && isGoogleApiKey(dto.apiKey) ? 'google' : dto.provider
    const repo = this.dataSource.getRepository(AiSettingsEntity)
    const existing = await repo.findOne({ where: { id: SINGLETON_SETTINGS_ID } })
    const defaults = AI_PROVIDER_DEFAULTS[effectiveProvider]
    const providerConfigs = parseProviderConfigs(existing?.providerConfigsJson)
    if (existing && !providerConfigs[existing.provider]) {
      providerConfigs[existing.provider] = {
        apiKey: existing.apiKey,
        baseUrl: existing.baseUrl,
      }
    }

    const previousEntry = readStoredProviderEntry(existing, effectiveProvider)
    const legacyGatewayKey =
      effectiveProvider === 'google' && !previousEntry.apiKey
        ? readStoredProviderEntry(existing, 'gateway').apiKey
        : ''
    const inheritedGoogleKey = isGoogleApiKey(legacyGatewayKey) ? legacyGatewayKey : ''

    const nextApiKey = dto.clearApiKey
      ? ''
      : dto.apiKey !== undefined
        ? dto.apiKey.trim()
        : previousEntry.apiKey || inheritedGoogleKey

    if (effectiveProvider === 'google' && isGoogleApiKey(providerConfigs.gateway?.apiKey)) {
      providerConfigs.gateway = {
        ...providerConfigs.gateway,
        apiKey: '',
      }
    }

    const nextBaseUrl =
      dto.baseUrl !== undefined
        ? dto.baseUrl.trim() || defaults.baseUrl
        : previousEntry.baseUrl || defaults.baseUrl

    providerConfigs[effectiveProvider] = {
      apiKey: nextApiKey,
      baseUrl: nextBaseUrl,
    }

    const nextRecord = repo.create({
      id: SINGLETON_SETTINGS_ID,
      provider: effectiveProvider,
      modelId: normalizeProviderModelId(effectiveProvider, dto.modelId),
      apiKey: nextApiKey,
      baseUrl: nextBaseUrl,
      providerConfigsJson: JSON.stringify(providerConfigs),
      updatedAt: new Date(),
    })

    await repo.save(nextRecord)
    if (effectiveProvider === 'google') {
      syncGoogleEnvApiKey(nextApiKey)
    }
    return this.getStatus()
  }

  async resolveLanguageModel(
    override?: SaveAiConfigDto,
    modelIdOverride?: string
  ): Promise<ResolvedModelBinding> {
    const effective = await this.getEffectiveConfig(override)
    const activeModelId = normalizeProviderModelId(
      effective.provider,
      modelIdOverride?.trim() || effective.modelId
    )
    const effectiveWithModel = { ...effective, modelId: activeModelId }
    const status = { ...(await this.getStatus(override)), modelId: activeModelId }

    if (!status.configured) {
      throw new Error(
        `No API key or local endpoint configured for ${AI_PROVIDER_DEFAULTS[effectiveWithModel.provider].label}. Open API Keys to add a Gemini API key.`
      )
    }

    const model = this.createLanguageModel(effectiveWithModel, Boolean(override?.apiKey))
    return { model, status }
  }

  async listAvailableModels(override?: SaveAiConfigDto): Promise<AiModelOptionDto[]> {
    const effective = await this.getEffectiveConfig(override)
    const dsOpts = this.dataSource?.options as
      | { type?: string; location?: string; database?: unknown }
      | undefined
    const isInMemory =
      dsOpts?.type === 'sqljs' ? !dsOpts.location : dsOpts?.database === ':memory:'
    const byId = new Map<string, AiModelOptionDto>()

    if (
      effective.apiKey &&
      !isInMemory &&
      !effective.apiKey.includes('Mock') &&
      effective.provider === 'google'
    ) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
            effective.apiKey
          )}`,
          { signal: AbortSignal.timeout(3500) }
        )
        if (res.ok) {
          const payload = (await res.json()) as {
            models?: Array<{
              name?: string
              displayName?: string
              description?: string
              supportedGenerationMethods?: string[]
            }>
          }
          for (const item of payload.models ?? []) {
            if (
              typeof item.name === 'string' &&
              item.name.startsWith('models/gemini-') &&
              Array.isArray(item.supportedGenerationMethods) &&
              item.supportedGenerationMethods.includes('generateContent')
            ) {
              const id = item.name.replace(/^models\//, '')
              byId.set(id, {
                id,
                name: item.displayName?.trim() || id,
                provider: 'google',
                ...(item.description ? { description: item.description } : {}),
              })
            }
          }
        }
      } catch {
        // Fall back to curated Gemini presets when offline or timed out
      }
    }

    if (byId.size === 0) {
      for (const preset of AI_MODEL_PRESETS.google ?? []) {
        byId.set(preset.id, preset)
      }
    }

    const normalizedEffectiveId = normalizeProviderModelId('google', effective.modelId)
    if (/^gemini-/i.test(normalizedEffectiveId) && !byId.has(normalizedEffectiveId)) {
      byId.set(normalizedEffectiveId, {
        id: normalizedEffectiveId,
        name: normalizedEffectiveId,
        provider: 'google',
      })
    }

    return Array.from(byId.values())
  }

  private createLanguageModel(
    effective: {
      provider: AiProviderId
      modelId: string
      apiKey: string
      baseUrl: string
    },
    isOverrideKey = false
  ): LanguageModel {
    const { provider, modelId, apiKey, baseUrl } = effective

    switch (provider) {
      case 'gateway': {
        const gw = createGateway({
          apiKey,
          ...(baseUrl ? { baseURL: baseUrl } : {}),
        })
        return gw(modelId)
      }

      case 'openai': {
        const openai = createOpenAI({
          apiKey,
          ...(baseUrl ? { baseURL: baseUrl } : {}),
        })
        return openai(modelId)
      }

      case 'anthropic': {
        const anthropic = createAnthropic({
          apiKey,
          ...(baseUrl ? { baseURL: baseUrl } : {}),
        })
        return anthropic(modelId)
      }

      case 'google': {
        const normalizedModelId = normalizeProviderModelId('google', modelId)
        if (
          !baseUrl &&
          apiKey &&
          (!isOverrideKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() === apiKey)
        ) {
          process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey
          return google(normalizedModelId)
        }
        const customGoogle = createGoogleGenerativeAI({
          apiKey,
          ...(baseUrl ? { baseURL: baseUrl } : {}),
        })
        return customGoogle(normalizedModelId)
      }

      case 'openai-compatible': {
        const compat = createOpenAICompatible({
          name: 'local-openai-compatible',
          baseURL: baseUrl || 'http://127.0.0.1:1234/v1',
          apiKey: apiKey || 'local-dev',
        })
        return compat(modelId)
      }
    }
  }
}
