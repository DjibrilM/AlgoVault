export type AiErrorCategory = 'api-key' | 'rate-limit' | 'model' | 'network' | 'agent'

export interface ClassifiedAiError {
  category: AiErrorCategory
  title: string
  summary: string
  detail: string
  retryable: boolean
}

function cleanRawErrorMessage(raw: unknown): string {
  const msg = raw instanceof Error ? raw.message : String(raw ?? 'Unknown error')
  return msg
    .replace(/^Error invoking remote method '[^']+':\s*(?:Error:\s*)?/i, '')
    .replace(/^Error:\s*/i, '')
    .trim()
}

/**
 * Classifies an AI/IPC failure so the UI clearly distinguishes API key issues,
 * quota/rate limits, model errors, network drops, and agent execution failures.
 */
export function classifyAiError(raw: unknown): ClassifiedAiError {
  const detail = cleanRawErrorMessage(raw) || 'Unexpected error while running the AI agent.'
  const lower = detail.toLowerCase()

  if (
    lower.includes('no api key') ||
    lower.includes('api key') ||
    lower.includes('api_key_invalid') ||
    lower.includes('invalid authentication') ||
    lower.includes('unauthorized') ||
    lower.includes('permission_denied') ||
    lower.includes('permission denied') ||
    /\b(401|403)\b/.test(lower)
  ) {
    return {
      category: 'api-key',
      title: 'API Key Error',
      summary: 'Your Google Gemini API key is missing, invalid, or lacks permission.',
      detail,
      retryable: true,
    }
  }

  if (
    lower.includes('429') ||
    lower.includes('resource_exhausted') ||
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests')
  ) {
    return {
      category: 'rate-limit',
      title: 'Quota / Rate Limit',
      summary: 'Google Gemini rate-limited this request or your key quota is exhausted.',
      detail,
      retryable: true,
    }
  }

  if (
    lower.includes('not found') ||
    lower.includes('unsupported model') ||
    lower.includes('model_not_found') ||
    /\b404\b/.test(lower)
  ) {
    return {
      category: 'model',
      title: 'Model Unavailable',
      summary: 'The selected Gemini model could not be reached. Try switching models.',
      detail,
      retryable: true,
    }
  }

  if (
    lower.includes('fetch failed') ||
    lower.includes('network') ||
    lower.includes('enotfound') ||
    lower.includes('econnrefused') ||
    lower.includes('etimedout') ||
    lower.includes('timed out') ||
    lower.includes('timeout')
  ) {
    return {
      category: 'network',
      title: 'Connection Error',
      summary: 'Could not reach the AI provider over the network.',
      detail,
      retryable: true,
    }
  }

  return {
    category: 'agent',
    title: 'Agent Error',
    summary: 'The Questions Factory agent ran into an error while processing your request.',
    detail,
    retryable: true,
  }
}
