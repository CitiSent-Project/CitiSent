export function loadFromStorage(key, fallbackValue) {
  if (typeof window === 'undefined') {
    return fallbackValue
  }

  try {
    const rawValue = window.localStorage.getItem(key)
    if (!rawValue) {
      return fallbackValue
    }

    return JSON.parse(rawValue)
  } catch {
    return fallbackValue
  }
}

export function saveToStorage(key, value) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isSchemaEnvelope(value) {
  if (!isObject(value)) {
    return false
  }

  return typeof value.schemaVersion === 'number' && 'payload' in value
}

function normalizeSchemaValue({
  value,
  schemaVersion,
  migrate,
  validate,
  fallbackValue,
}) {
  try {
    const migratedValue = migrate
      ? migrate({ payload: value, fromVersion: 0, toVersion: schemaVersion })
      : value

    return validate ? validate(migratedValue) : migratedValue
  } catch {
    return fallbackValue
  }
}

export function loadFromStorageWithSchema(
  key,
  fallbackValue,
  { schemaVersion = 1, migrate, validate, writeBackOnRead = true } = {}
) {
  if (typeof window === 'undefined') {
    return fallbackValue
  }

  try {
    const rawValue = window.localStorage.getItem(key)
    if (!rawValue) {
      return fallbackValue
    }

    const parsedValue = JSON.parse(rawValue)

    if (!isSchemaEnvelope(parsedValue)) {
      const normalizedValue = normalizeSchemaValue({
        value: parsedValue,
        schemaVersion,
        migrate,
        validate,
        fallbackValue,
      })

      if (writeBackOnRead && normalizedValue !== fallbackValue) {
        saveToStorageWithSchema(key, normalizedValue, { schemaVersion })
      }

      return normalizedValue
    }

    const normalizedVersion = Number.isFinite(parsedValue.schemaVersion)
      ? parsedValue.schemaVersion
      : 0

    const migratedPayload = migrate
      ? migrate({
          payload: parsedValue.payload,
          fromVersion: normalizedVersion,
          toVersion: schemaVersion,
        })
      : parsedValue.payload

    const normalizedPayload = validate ? validate(migratedPayload) : migratedPayload

    if (writeBackOnRead && normalizedVersion !== schemaVersion) {
      saveToStorageWithSchema(key, normalizedPayload, { schemaVersion })
    }

    return normalizedPayload
  } catch {
    return fallbackValue
  }
}

export function saveToStorageWithSchema(key, value, { schemaVersion = 1 } = {}) {
  if (typeof window === 'undefined') {
    return
  }

  const envelope = {
    schemaVersion,
    payload: value,
  }

  window.localStorage.setItem(key, JSON.stringify(envelope))
}
