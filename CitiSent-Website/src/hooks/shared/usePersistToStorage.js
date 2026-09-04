import { useEffect } from 'react'
import { saveToStorage, saveToStorageWithSchema } from '../../services/storageService'

export function usePersistToStorage(key, value, options = {}) {
  useEffect(() => {
    if (options.withSchema) {
      saveToStorageWithSchema(key, value, {
        schemaVersion: options.schemaVersion,
      })
      return
    }

    saveToStorage(key, value)
  }, [key, value, options.withSchema, options.schemaVersion])
}
