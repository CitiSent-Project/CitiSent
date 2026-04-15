import { resolveApiBaseUrl } from './apiConfig'

const BASE_URL = resolveApiBaseUrl()
const RETRYABLE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
const MAX_NETWORK_ATTEMPTS = 3
const DEFAULT_REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS) > 0
  ? Number(import.meta.env.VITE_API_TIMEOUT_MS)
  : 15000

function buildRequestUrl(endpoint) {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${BASE_URL}${normalizedEndpoint}`
}

function buildHeaders(token, customHeaders) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  }
}

function buildValidationDetailsSummary(details) {
  if (!Array.isArray(details) || details.length === 0) {
    return ''
  }

  const summary = details
    .filter((detail) => detail && typeof detail === 'object')
    .map((detail) => {
      const path = String(detail.path || '').trim()
      const message = String(detail.message || '').trim()

      if (!path && !message) {
        return ''
      }

      return path && message ? `${path}: ${message}` : path || message
    })
    .filter(Boolean)
    .join(' | ')

  return summary
}

function isNetworkError(error) {
  return (
    error instanceof TypeError ||
    /Failed to fetch|ERR_CONNECTION_REFUSED|NetworkError|ECONNREFUSED/i.test(
      String(error?.message || '')
    )
  )
}

function isAbortError(error) {
  return error?.name === 'AbortError'
}

function buildTimeoutMessage(endpoint, timeoutMs) {
  return `Request timed out after ${timeoutMs}ms while calling ${endpoint}. Please retry.`
}

function getRetryDelayMs(attempt) {
  const jitterMs = Math.floor(Math.random() * 120)
  return attempt * 250 + jitterMs
}

function createTimedSignal(timeoutMs, upstreamSignal) {
  const controller = new AbortController()
  const normalizedTimeoutMs = Number.isFinite(timeoutMs) && timeoutMs > 0
    ? timeoutMs
    : DEFAULT_REQUEST_TIMEOUT_MS

  const timeoutHandle = window.setTimeout(() => {
    controller.abort()
  }, normalizedTimeoutMs)

  const abortFromUpstream = () => controller.abort()

  if (upstreamSignal) {
    if (upstreamSignal.aborted) {
      controller.abort()
    } else {
      upstreamSignal.addEventListener('abort', abortFromUpstream, { once: true })
    }
  }

  return {
    signal: controller.signal,
    timeoutMs: normalizedTimeoutMs,
    cleanup: () => {
      window.clearTimeout(timeoutHandle)
      if (upstreamSignal) {
        upstreamSignal.removeEventListener('abort', abortFromUpstream)
      }
    },
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function request(endpoint, options = {}) {
  const {
    headers,
    token,
    timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
    signal: upstreamSignal,
    ...requestOptions
  } = options
  const requestUrl = buildRequestUrl(endpoint)
  const method = String(requestOptions.method || 'GET').toUpperCase()
  const shouldRetryOnNetworkError = RETRYABLE_METHODS.has(method)
  const maxAttempts = shouldRetryOnNetworkError ? MAX_NETWORK_ATTEMPTS : 1
  let response

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const timedSignal = createTimedSignal(timeoutMs, upstreamSignal)

    try {
      response = await fetch(requestUrl, {
        headers: buildHeaders(token, headers),
        signal: timedSignal.signal,
        ...requestOptions,
      })
      break
    } catch (error) {
      if (isAbortError(error)) {
        throw new Error(buildTimeoutMessage(endpoint, timedSignal.timeoutMs))
      }

      if (isNetworkError(error) && attempt < maxAttempts) {
        await wait(getRetryDelayMs(attempt))
        continue
      }

      if (isNetworkError(error)) {
        throw new Error(
          `Unable to reach the API server at ${BASE_URL}. Ensure the backend is running and reachable.`
        )
      }

      throw error
    } finally {
      timedSignal.cleanup()
    }
  }

  const rawBody = await response.text()
  let parsedBody = null

  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody)
    } catch {
      parsedBody = rawBody
    }
  }

  if (!response.ok) {
    const isObjectBody = parsedBody && typeof parsedBody === 'object'
    const backendMessage = isObjectBody ? parsedBody.message || parsedBody.error : undefined
    const detailsSummary = isObjectBody
      ? buildValidationDetailsSummary(parsedBody.details)
      : ''
    const composedMessage = [backendMessage || `Request failed (${response.status})`, detailsSummary]
      .filter(Boolean)
      .join(' - ')

    const apiError = new Error(composedMessage)
    apiError.name = 'ApiClientError'
    apiError.status = response.status
    apiError.requestId = isObjectBody ? parsedBody.requestId : undefined
    apiError.details = isObjectBody ? parsedBody.details : undefined

    throw apiError
  }

  return parsedBody
}

export const apiClient = {
  get: (endpoint, options = {}) => request(endpoint, options),
  post: (endpoint, body, options = {}) =>
    request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    }),
  patch: (endpoint, body, options = {}) =>
    request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...options,
    }),
  delete: (endpoint, options = {}) =>
    request(endpoint, {
      method: 'DELETE',
      ...options,
    }),
}
