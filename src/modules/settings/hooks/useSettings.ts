import { useEffect, useState } from 'react'
import { useSetAtom } from 'jotai'
import { activeNavAtom, activeCategoryAtom } from '@/shared/store'
import { aiClient } from '@/shared/services/aiClient'
import {
  useAiConfigQuery,
  useAiModelsQuery,
  useSaveAiConfigMutation,
} from '@/shared/hooks/useWorkspaceQueries'
import {
  AI_PROVIDER_DEFAULTS,
  type AiConnectionTestResultDto,
  type AiProviderId,
} from '@/shared/types/ai'

export function useSettings() {
  const setActiveNav = useSetAtom(activeNavAtom)
  const setActiveCategory = useSetAtom(activeCategoryAtom)

  const { data: status, isLoading } = useAiConfigQuery()
  const saveMutation = useSaveAiConfigMutation()

  const [provider, setProvider] = useState<AiProviderId>('gateway')
  const [modelId, setModelId] = useState(AI_PROVIDER_DEFAULTS.gateway.modelId)
  const [baseUrl, setBaseUrl] = useState(AI_PROVIDER_DEFAULTS.gateway.baseUrl)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [clearStoredKey, setClearStoredKey] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<AiConnectionTestResultDto | null>(null)
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null)
  const {
    data: availableModels = [],
    isLoading: isModelsInitialLoading,
    isFetching: isModelsFetching,
  } = useAiModelsQuery(provider, baseUrl)
  const isModelsLoading =
    isModelsInitialLoading || (isModelsFetching && availableModels.length === 0)

  useEffect(() => {
    if (!status) return
    setProvider(status.provider)
    setModelId(status.modelId)
    setBaseUrl(status.baseUrl)
  }, [status])

  const selectProvider = (nextProvider: AiProviderId) => {
    setProvider(nextProvider)
    const defaults = AI_PROVIDER_DEFAULTS[nextProvider]
    setModelId(defaults.modelId)
    setBaseUrl(defaults.baseUrl)
    setApiKeyInput('')
    setClearStoredKey(false)
    setTestResult(null)
    setSaveFeedback(null)
  }

  const handleSave = async () => {
    setSaveFeedback(null)
    const trimmedKey = apiKeyInput.trim()
    await saveMutation.mutateAsync({
      provider,
      modelId: modelId.trim() || AI_PROVIDER_DEFAULTS[provider].modelId,
      baseUrl: baseUrl.trim(),
      ...(trimmedKey ? { apiKey: trimmedKey } : {}),
      ...(clearStoredKey ? { clearApiKey: true } : {}),
    })
    setApiKeyInput('')
    setClearStoredKey(false)
    setSaveFeedback('Configuration saved locally.')
  }

  const handleTest = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      const trimmedKey = apiKeyInput.trim()
      const res = await aiClient.testConnection({
        provider,
        modelId: modelId.trim() || AI_PROVIDER_DEFAULTS[provider].modelId,
        baseUrl: baseUrl.trim(),
        ...(trimmedKey ? { apiKey: trimmedKey } : {}),
        ...(clearStoredKey ? { clearApiKey: true } : {}),
      })
      setTestResult(res)
    } finally {
      setIsTesting(false)
    }
  }

  const selectModel = (nextModelId: string) => {
    setModelId(nextModelId)
    setSaveFeedback(null)
  }

  const returnHome = () => {
    setActiveNav('home')
    setActiveCategory(null)
  }

  return {
    status,
    availableModels,
    isModelsLoading,
    isLoading,
    provider,
    modelId,
    setModelId,
    selectModel,
    baseUrl,
    setBaseUrl,
    apiKeyInput,
    setApiKeyInput,
    clearStoredKey,
    setClearStoredKey,
    selectProvider,
    handleSave,
    handleTest,
    isSaving: saveMutation.isPending,
    isTesting,
    testResult,
    saveFeedback,
    returnHome,
  }
}
