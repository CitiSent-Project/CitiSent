import { resolveApiBaseUrl } from './apiConfig'

const BASE_URL = resolveApiBaseUrl()
const RETRYABLE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
const MAX_NETWORK_ATTEMPTS = 3
const DEFAULT_REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS) > 0
  ? Number(import.meta.env.VITE_API_TIMEOUT_MS)
  : 15000

const TECHNICAL_MESSAGE_PATTERNS = [
  /request validation failed/i,
  /request failed \(\d+\)/i,
  /body\./i,
  /query\./i,
  /params\./i,
  /path\./i,
  /failed to fetch/i,
  /networkerror/i,
  /err_connection_refused/i,
  /unable to reach the api server/i,
  /timed out after/i,
]

const FRIENDLY_FIELD_LABELS = {
  address: 'address',
  departmentId: 'department',
  email: 'email address',
  fullName: 'full name',
  password: 'password',
  phone: 'phone number',
  phoneNumber: 'phone number',
  requestedDepartmentId: 'requested department',
  currentDepartmentId: 'current department',
  reportId: 'report ID',
  status: 'status',
}

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

function humanizeFieldLabel(field) {
  const normalized = String(field || '')
    .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()

  if (!normalized) {
    return ''
  }

  const lowerCased = normalized.toLowerCase()
  return FRIENDLY_FIELD_LABELS[normalized] || FRIENDLY_FIELD_LABELS[lowerCased] || lowerCased
}

function extractValidationFields(details) {
  const fields = new Set()

  if (!Array.isArray(details)) {
    return []
  }

  details.forEach((detail) => {
    const path = String(detail?.path || '').trim()
    if (!path) {
      return
    }

    const parts = path.split('.')
    const field = parts[parts.length - 1]
    const humanized = humanizeFieldLabel(field)
    if (humanized) {
      fields.add(humanized)
    }
  })

  return Array.from(fields)
}

function formatFriendlyFieldList(fields) {
  if (fields.length === 0) {
    return ''
  }

  if (fields.length === 1) {
    return fields[0]
  }

  if (fields.length === 2) {
    return `${fields[0]} and ${fields[1]}`
  }

  return `${fields.slice(0, -1).join(', ')}, and ${fields[fields.length - 1]}`
}

function isTechnicalMessage(message) {
  return TECHNICAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(message))
}

function buildUserFacingErrorMessage({ status, backendMessage, details }) {
  const validationFields = extractValidationFields(details)

  if (validationFields.length > 0) {
    const formattedFields = formatFriendlyFieldList(validationFields)
    return validationFields.length === 1
      ? `Please check the ${formattedFields} and try again.`
      : `Please review the ${formattedFields} fields and try again.`
  }

  if (backendMessage && !isTechnicalMessage(backendMessage)) {
    return backendMessage
  }

  if (status === 401) {
    return 'Your session has expired. Please sign in again.'
  }

  if (status === 403) {
    return 'You do not have permission to complete this action.'
  }

  if (status === 404) {
    return 'The requested item could not be found.'
  }

  if (status >= 500) {
    return 'The server could not complete your request. Please try again.'
  }

  return 'Please review your information and try again.'
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
    const userMessage = buildUserFacingErrorMessage({
      status: response.status,
      backendMessage,
      details: isObjectBody ? parsedBody.details : undefined,
    })
    const composedMessage = [backendMessage || `Request failed (${response.status})`, detailsSummary]
      .filter(Boolean)
      .join(' - ')

    const apiError = new Error(userMessage)
    apiError.name = 'ApiClientError'
    apiError.status = response.status
    apiError.requestId = isObjectBody ? parsedBody.requestId : undefined
    apiError.details = isObjectBody ? parsedBody.details : undefined
    apiError.userMessage = userMessage
    apiError.debugMessage = composedMessage

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
