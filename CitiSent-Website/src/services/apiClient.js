import { resolveApiBaseUrl } from './apiConfig'

const BASE_URL = resolveApiBaseUrl()

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

async function request(endpoint, options = {}) {
  const { headers, token, ...requestOptions } = options
  const requestUrl = buildRequestUrl(endpoint)
  let response

  try {
    response = await fetch(requestUrl, {
      headers: buildHeaders(token, headers),
      ...requestOptions,
    })
  } catch (error) {
    const networkError =
      error instanceof TypeError ||
      /Failed to fetch|ERR_CONNECTION_REFUSED|NetworkError/i.test(String(error?.message || ''))

    if (networkError) {
      throw new Error(
        `Unable to reach the API server at ${BASE_URL}. Ensure the backend is running and reachable.`
      )
    }

    throw error
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
