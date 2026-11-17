/**
 * @file services/model-factory.service.ts
 * @description Resolves Vercel AI SDK LanguageModel instances across AI Gateway,
 * OpenAI, Anthropic, Google Gemini, and local OpenAI-compatible servers (LM Studio / Ollama).
 */

import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createGateway, gateway, type LanguageModel } from 'ai'
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

export function maskSecret(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.length <= 8) return '••••••••'
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`
}

function getEnvApiKey(provider: AiProviderId): string {
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
  if (process.env.AI_GATEWAY_API_KEY?.trim()) return 'gateway'
  if (process.env.OPENAI_API_KEY?.trim()) return 'openai'
  if (process.env.ANTHROPIC_API_KEY?.trim()) return 'anthropic'
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()) return 'google'
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
      const provider = override.provider
      const defaults = AI_PROVIDER_DEFAULTS[provider]
      const savedEntry = readStoredProviderEntry(stored, provider)
      const apiKey = override.clearApiKey
        ? ''
        : override.apiKey !== undefined
          ? override.apiKey.trim()
          : savedEntry.apiKey || getEnvApiKey(provider)
      const explicitBaseUrl =
        override.baseUrl !== undefined ? override.baseUrl.trim() : savedEntry.baseUrl
      const baseUrl =
        explicitBaseUrl ||
        getEnvBaseUrl(provider) ||
        defaults.baseUrl
      const modelId = override.modelId.trim() || defaults.modelId
      const source: AiProviderStatusDto['source'] =
        apiKey
          ? override.apiKey || savedEntry.apiKey
            ? 'settings'
            : 'env'
          : provider === 'openai-compatible' && baseUrl
            ? 'local'
            : 'none'

      return { provider, modelId, apiKey, baseUrl, source }
    }

    if (stored) {
      const provider = stored.provider
      const defaults = AI_PROVIDER_DEFAULTS[provider]
      const savedEntry = readStoredProviderEntry(stored, provider)
      const storedKey = savedEntry.apiKey
      const envKey = getEnvApiKey(provider)
      const apiKey = storedKey || envKey
      const baseUrl =
        savedEntry.baseUrl || getEnvBaseUrl(provider) || defaults.baseUrl
      const modelId = stored.modelId.trim() || defaults.modelId

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
      const modelId =
        process.env.ALGOVALUT_AI_MODEL?.trim() ||
        process.env.ALGOVAULT_AI_MODEL?.trim() ||
        defaults.modelId
      const source: AiProviderStatusDto['source'] =
        apiKey ? 'env' : 'local'

      return { provider: envProvider, modelId, apiKey, baseUrl, source }
    }

    const fallbackProvider: AiProviderId = 'gateway'
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

    const repo = this.dataSource.getRepository(AiSettingsEntity)
    const existing = await repo.findOne({ where: { id: SINGLETON_SETTINGS_ID } })
    const defaults = AI_PROVIDER_DEFAULTS[dto.provider]
    const providerConfigs = parseProviderConfigs(existing?.providerConfigsJson)
    if (existing && !providerConfigs[existing.provider]) {
      providerConfigs[existing.provider] = {
        apiKey: existing.apiKey,
        baseUrl: existing.baseUrl,
      }
    }

    const previousEntry = readStoredProviderEntry(existing, dto.provider)
    const nextApiKey = dto.clearApiKey
      ? ''
      : dto.apiKey !== undefined
        ? dto.apiKey.trim()
        : previousEntry.apiKey

    const nextBaseUrl =
      dto.baseUrl !== undefined
        ? dto.baseUrl.trim() || defaults.baseUrl
        : previousEntry.baseUrl || defaults.baseUrl

    providerConfigs[dto.provider] = {
      apiKey: nextApiKey,
      baseUrl: nextBaseUrl,
    }

    const nextRecord = repo.create({
      id: SINGLETON_SETTINGS_ID,
      provider: dto.provider,
      modelId: dto.modelId.trim() || defaults.modelId,
      apiKey: nextApiKey,
      baseUrl: nextBaseUrl,
      providerConfigsJson: JSON.stringify(providerConfigs),
      updatedAt: new Date(),
    })

    await repo.save(nextRecord)
    return this.getStatus()
  }

  async resolveLanguageModel(
    override?: SaveAiConfigDto,
    modelIdOverride?: string
  ): Promise<ResolvedModelBinding> {
    const effective = await this.getEffectiveConfig(override)
    const activeModelId = modelIdOverride?.trim() || effective.modelId
    const effectiveWithModel = { ...effective, modelId: activeModelId }
    const status = { ...(await this.getStatus(override)), modelId: activeModelId }

    if (!status.configured) {
      throw new Error(
        `No API key or local endpoint configured for ${AI_PROVIDER_DEFAULTS[effectiveWithModel.provider].label}. Open Settings to configure an AI provider.`
      )
    }

    const model = this.createLanguageModel(effectiveWithModel)
    return { model, status }
  }

  async listAvailableModels(override?: SaveAiConfigDto): Promise<AiModelOptionDto[]> {
    const effective = await this.getEffectiveConfig(override)
    const presets = AI_MODEL_PRESETS[effective.provider] ?? []
    const byId = new Map<string, AiModelOptionDto>()

    for (const preset of presets) {
      byId.set(preset.id, preset)
    }

    if (effective.provider === 'gateway') {
      try {
        const gw =
          effective.apiKey || effective.baseUrl
            ? createGateway({
                ...(effective.apiKey ? { apiKey: effective.apiKey } : {}),
                ...(effective.baseUrl ? { baseURL: effective.baseUrl } : {}),
              })
            : gateway
        const { models } = await gw.getAvailableModels()
        for (const entry of models) {
          if (entry.modelType && entry.modelType !== 'language') continue
          const existing = byId.get(entry.id)
          const modelProvider = entry.id.includes('/')
            ? entry.id.split('/')[0]
            : existing?.provider || 'gateway'
          byId.set(entry.id, {
            id: entry.id,
            name: entry.name || existing?.name || entry.id,
            provider: modelProvider,
            ...(entry.description ? { description: entry.description } : {}),
          })
        }
      } catch {
        // Offline or unreachable gateway: fall back cleanly to curated presets
      }
    } else if (effective.provider === 'openai-compatible' && effective.baseUrl) {
      try {
        const url = `${effective.baseUrl.replace(/\/+$/, '')}/models`
        const res = await fetch(url, {
          headers: effective.apiKey ? { Authorization: `Bearer ${effective.apiKey}` } : undefined,
          signal: AbortSignal.timeout(2000),
        })
        if (res.ok) {
          const payload = (await res.json()) as { data?: Array<{ id?: string }> }
          for (const entry of payload.data ?? []) {
            if (!entry.id) continue
            if (!byId.has(entry.id)) {
              byId.set(entry.id, {
                id: entry.id,
                name: entry.id,
                provider: 'Local',
              })
            }
          }
        }
      } catch {
        // Local server stopped: keep preset list
      }
    }

    if (effective.modelId && !byId.has(effective.modelId)) {
      const providerKey = effective.modelId.includes('/')
        ? effective.modelId.split('/')[0]
        : effective.provider
      byId.set(effective.modelId, {
        id: effective.modelId,
        name: effective.modelId,
        provider: providerKey,
      })
    }

    return Array.from(byId.values())
  }

  private createLanguageModel(effective: {
    provider: AiProviderId
    modelId: string
    apiKey: string
    baseUrl: string
  }): LanguageModel {
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
        const google = createGoogleGenerativeAI({
          apiKey,
          ...(baseUrl ? { baseURL: baseUrl } : {}),
        })
        return google(modelId)
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
