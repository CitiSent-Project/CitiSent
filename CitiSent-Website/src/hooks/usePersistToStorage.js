import { useEffect } from 'react'
import { saveToStorage } from '../services/storageService'

export function usePersistToStorage(key, value) {
  useEffect(() => {
    saveToStorage(key, value)
  }, [key, value])
}
