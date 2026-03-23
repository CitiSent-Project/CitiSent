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

async function request(endpoint, options = {}) {
  const { headers, token, ...requestOptions } = options

  const response = await fetch(buildRequestUrl(endpoint), {
    headers: buildHeaders(token, headers),
    ...requestOptions,
  })

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
    const backendMessage =
      parsedBody && typeof parsedBody === 'object'
        ? parsedBody.message || parsedBody.error
        : undefined

    throw new Error(backendMessage || `Request failed (${response.status})`)
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
