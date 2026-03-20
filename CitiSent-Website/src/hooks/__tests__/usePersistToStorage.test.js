import { describe, expect, it, vi } from 'vitest'

const { useEffectMock, saveToStorageMock, saveToStorageWithSchemaMock } = vi.hoisted(() => ({
  useEffectMock: vi.fn((callback) => callback()),
  saveToStorageMock: vi.fn(),
  saveToStorageWithSchemaMock: vi.fn(),
}))

vi.mock('react', () => ({
  useEffect: useEffectMock,
}))

vi.mock('../../services/storageService', () => ({
  saveToStorage: saveToStorageMock,
  saveToStorageWithSchema: saveToStorageWithSchemaMock,
}))

import { usePersistToStorage } from '../usePersistToStorage'

describe('usePersistToStorage', () => {
  it('persists key/value inside effect callback', () => {
    usePersistToStorage('prefs', { theme: 'Light' })

    expect(useEffectMock).toHaveBeenCalledTimes(1)
    expect(useEffectMock).toHaveBeenCalledWith(expect.any(Function), [
      'prefs',
      { theme: 'Light' },
      undefined,
      undefined,
    ])
    expect(saveToStorageMock).toHaveBeenCalledWith('prefs', { theme: 'Light' })
  })

  it('persists versioned payload when schema mode is enabled', () => {
    usePersistToStorage('prefs', { theme: 'Dark' }, { withSchema: true, schemaVersion: 3 })

    expect(saveToStorageWithSchemaMock).toHaveBeenCalledWith('prefs', { theme: 'Dark' }, {
      schemaVersion: 3,
    })
  })
})
