export function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function asString(value, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

export function asBoolean(value, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

export function asNumber(value, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function asArray(value, fallback = []) {
  return Array.isArray(value) ? value : fallback
}

export function asObject(value, fallback = {}) {
  return isObject(value) ? value : fallback
}
