function normalizeUrl(url) {
  return String(url || '').trim().replace(/\/+$/, '')
}

export function resolveApiBaseUrl() {
  const envBaseUrl = normalizeUrl(import.meta.env.VITE_API_BASE_URL)
  if (envBaseUrl) {
    return envBaseUrl
  }

  return 'http://localhost:4000/api/v1'
}
