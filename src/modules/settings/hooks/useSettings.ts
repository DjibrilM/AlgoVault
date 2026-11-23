import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSetAtom } from 'jotai'
import { activeCategoryAtom, activeNavAtom } from '@/shared/store'
import { aiClient } from '@/shared/services/aiClient'
import {
  useAiConfigQuery,
  useSaveAiConfigMutation,
} from '@/shared/hooks/useWorkspaceQueries'
import {
  AI_PROVIDER_DEFAULTS,
  type AiConnectionTestResultDto,
} from '@/shared/types/ai'

const API_KEYS_STORAGE_KEY = 'algovault:gemini-api-keys:v1'

export interface StoredApiKeyEntry {
  id: string
  name: string
  maskedSuffix: string
  apiKey?: string
  source: 'settings' | 'env'
  createdAt: string
  lastTestedAt?: string
  isActive: boolean
}

export interface ApiKeyToastState {
  id: string
  state: 'loading' | 'success' | 'error'
  title: string
  detail?: string
}

type PersistedApiKeyEntry = Omit<StoredApiKeyEntry, 'isActive'>

function toKeySuffix(rawOrMasked: string): string {
  const trimmed = rawOrMasked.trim()
  if (!trimmed) return '••••'
  return `...${trimmed.slice(-4)}`
}

function readStoredEntries(): PersistedApiKeyEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(API_KEYS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
      .map((item) => ({
        id: typeof item.id === 'string' ? item.id : `key-${Date.now()}`,
        name: typeof item.name === 'string' ? item.name : 'Gemini API Key',
        maskedSuffix:
          typeof item.maskedSuffix === 'string'
            ? item.maskedSuffix
            : typeof item.apiKey === 'string'
              ? toKeySuffix(item.apiKey)
              : '••••',
        apiKey: typeof item.apiKey === 'string' ? item.apiKey : undefined,
        source: item.source === 'env' ? 'env' : 'settings',
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
        lastTestedAt: typeof item.lastTestedAt === 'string' ? item.lastTestedAt : undefined,
      }))
  } catch {
    return []
  }
}

function writeStoredEntries(items: PersistedApiKeyEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Ignore storage errors
  }
}

export function useSettings() {
  const setActiveNav = useSetAtom(activeNavAtom)
  const setActiveCategory = useSetAtom(activeCategoryAtom)

  const { data: status, isLoading } = useAiConfigQuery()
  const saveMutation = useSaveAiConfigMutation()

  const [storedEntries, setStoredEntries] = useState<PersistedApiKeyEntry[]>(() =>
    readStoredEntries()
  )

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [keyNameInput, setKeyNameInput] = useState('Personal Gemini Key')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null)
  const [testResultByKey, setTestResultByKey] = useState<
    Record<string, AiConnectionTestResultDto>
  >({})
  const [toast, setToast] = useState<ApiKeyToastState | null>(null)
  const toastTimeoutRef = useRef<number | null>(null)
  const [renamingEntry, setRenamingEntry] = useState<StoredApiKeyEntry | null>(null)
  const [renameInput, setRenameInput] = useState('')

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current)
      }
    }
  }, [])

  const dismissToast = useCallback(() => {
    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current)
      toastTimeoutRef.current = null
    }
    setToast(null)
  }, [])

  const activeModelId = status?.modelId || AI_PROVIDER_DEFAULTS.google.modelId
  const activeSuffix = status?.maskedApiKey ? toKeySuffix(status.maskedApiKey) : null

  useEffect(() => {
    writeStoredEntries(storedEntries)
  }, [storedEntries])

  const entries = useMemo<StoredApiKeyEntry[]>(() => {
    const result: StoredApiKeyEntry[] = storedEntries.map((item) => ({
      ...item,
      source: 'settings',
      isActive: Boolean(
        status?.configured && activeSuffix && item.maskedSuffix === activeSuffix
      ),
    }))

    if (
      status?.configured &&
      activeSuffix &&
      !result.some((item) => item.maskedSuffix === activeSuffix)
    ) {
      result.unshift({
        id: 'active-gemini-key',
        name: 'Active Gemini API Key',
        maskedSuffix: activeSuffix,
        source: 'settings',
        createdAt: new Date().toISOString(),
        isActive: true,
      })
    }

    return result
  }, [activeSuffix, status?.configured, storedEntries])

  const openAddModal = useCallback(() => {
    setFormError(null)
    setKeyNameInput('Personal Gemini Key')
    setApiKeyInput('')
    setIsAddModalOpen(true)
  }, [])

  const closeAddModal = useCallback(() => {
    setFormError(null)
    setIsAddModalOpen(false)
  }, [])

  const addApiKey = useCallback(async () => {
    const trimmedKey = apiKeyInput.trim().replace(/^['"]+|['"]+$/g, '').trim()
    if (!trimmedKey) {
      setFormError('Enter your Google Gemini API key.')
      return
    }

    setFormError(null)
    const name = keyNameInput.trim() || 'Gemini API Key'
    const suffix = toKeySuffix(trimmedKey)

    try {
      await saveMutation.mutateAsync({
        provider: 'google',
        modelId: activeModelId,
        apiKey: trimmedKey,
      })

      const newEntry: PersistedApiKeyEntry = {
        id: `key-${Date.now()}`,
        name,
        maskedSuffix: suffix,
        apiKey: trimmedKey,
        source: 'settings',
        createdAt: new Date().toISOString(),
      }

      setStoredEntries((prev) => [
        newEntry,
        ...prev.filter((item) => item.apiKey !== trimmedKey),
      ])
      setIsAddModalOpen(false)
      setApiKeyInput('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err))
    }
  }, [activeModelId, apiKeyInput, keyNameInput, saveMutation])

  const activateApiKey = useCallback(
    async (entry: StoredApiKeyEntry) => {
      if (entry.isActive || !entry.apiKey) return
      await saveMutation.mutateAsync({
        provider: 'google',
        modelId: activeModelId,
        apiKey: entry.apiKey,
      })
    },
    [activeModelId, saveMutation]
  )

  const copyApiKey = useCallback((entry: StoredApiKeyEntry) => {
    const value = entry.apiKey || entry.maskedSuffix
    void navigator.clipboard.writeText(value)
    setCopiedKeyId(entry.id)
    window.setTimeout(() => {
      setCopiedKeyId((current) => (current === entry.id ? null : current))
    }, 1600)
  }, [])

  const testApiKey = useCallback(
    async (entry: StoredApiKeyEntry) => {
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current)
        toastTimeoutRef.current = null
      }
      const toastId = `verify-${entry.id}`
      setToast({
        id: toastId,
        state: 'loading',
        title: `Verifying ${entry.name}…`,
        detail: `Checking Gemini API connection (${entry.maskedSuffix})`,
      })
      setTestingKeyId(entry.id)
      try {
        const res = await aiClient.testConnection({
          provider: 'google',
          modelId: activeModelId,
          ...(entry.apiKey ? { apiKey: entry.apiKey } : {}),
        })
        setTestResultByKey((prev) => ({ ...prev, [entry.id]: res }))
        setToast(
          res.ok
            ? {
                id: toastId,
                state: 'success',
                title: 'API key verified',
                detail: `${entry.name} connected (${res.latencyMs}ms)`,
              }
            : {
                id: toastId,
                state: 'error',
                title: 'Verification failed',
                detail: res.error || 'Could not connect with this API key.',
              }
        )
        if (entry.source === 'settings') {
          const testedAt = new Date().toISOString()
          setStoredEntries((prev) =>
            prev.map((item) =>
              item.id === entry.id ? { ...item, lastTestedAt: testedAt } : item
            )
          )
        }
      } catch (err) {
        setToast({
          id: toastId,
          state: 'error',
          title: 'Verification failed',
          detail: err instanceof Error ? err.message : String(err),
        })
      } finally {
        setTestingKeyId((current) => (current === entry.id ? null : current))
        toastTimeoutRef.current = window.setTimeout(() => {
          setToast((current) => (current?.id === toastId ? null : current))
          toastTimeoutRef.current = null
        }, 4200)
      }
    },
    [activeModelId]
  )

  const openRenameModal = useCallback((entry: StoredApiKeyEntry) => {
    setRenamingEntry(entry)
    setRenameInput(entry.name)
  }, [])

  const closeRenameModal = useCallback(() => {
    setRenamingEntry(null)
  }, [])

  const submitRenameKey = useCallback(() => {
    const nextName = renameInput.trim()
    if (!nextName || !renamingEntry) return

    setStoredEntries((prev) => {
      const exists = prev.some((item) => item.id === renamingEntry.id)
      if (exists) {
        return prev.map((item) =>
          item.id === renamingEntry.id ? { ...item, name: nextName } : item
        )
      }
      return [
        {
          id: `key-${Date.now()}`,
          name: nextName,
          maskedSuffix: renamingEntry.maskedSuffix,
          apiKey: renamingEntry.apiKey,
          source: 'settings',
          createdAt: renamingEntry.createdAt,
        },
        ...prev,
      ]
    })
    setRenamingEntry(null)
  }, [renameInput, renamingEntry])

  const deleteApiKey = useCallback(
    async (entry: StoredApiKeyEntry) => {
      const remaining = storedEntries.filter((item) => item.id !== entry.id)
      setStoredEntries(remaining)

      if (entry.isActive) {
        const nextSaved = remaining.find((item) => item.apiKey)
        if (nextSaved?.apiKey) {
          await saveMutation.mutateAsync({
            provider: 'google',
            modelId: activeModelId,
            apiKey: nextSaved.apiKey,
          })
        } else {
          await saveMutation.mutateAsync({
            provider: 'google',
            modelId: activeModelId,
            clearApiKey: true,
          })
        }
      }
    },
    [activeModelId, saveMutation, storedEntries]
  )

  const returnHome = useCallback(() => {
    setActiveNav('home')
    setActiveCategory(null)
  }, [setActiveCategory, setActiveNav])

  return {
    status,
    isLoading,
    entries,
    totalCount: entries.length,
    isAddModalOpen,
    setIsAddModalOpen,
    openAddModal,
    closeAddModal,
    keyNameInput,
    setKeyNameInput,
    apiKeyInput,
    setApiKeyInput,
    formError,
    isSaving: saveMutation.isPending,
    copiedKeyId,
    testingKeyId,
    testResultByKey,
    toast,
    dismissToast,
    renamingEntry,
    renameInput,
    setRenameInput,
    openRenameModal,
    closeRenameModal,
    submitRenameKey,
    addApiKey,
    activateApiKey,
    copyApiKey,
    testApiKey,
    deleteApiKey,
    returnHome,
  }
}
