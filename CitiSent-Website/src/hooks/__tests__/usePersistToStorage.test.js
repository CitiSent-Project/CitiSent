import { describe, expect, it, vi } from 'vitest'

const { useEffectMock, saveToStorageMock } = vi.hoisted(() => ({
  useEffectMock: vi.fn((callback) => callback()),
  saveToStorageMock: vi.fn(),
}))

vi.mock('react', () => ({
  useEffect: useEffectMock,
}))

vi.mock('../../services/storageService', () => ({
  saveToStorage: saveToStorageMock,
}))

import { usePersistToStorage } from '../usePersistToStorage'

describe('usePersistToStorage', () => {
  it('persists key/value inside effect callback', () => {
    usePersistToStorage('prefs', { theme: 'Light' })

    expect(useEffectMock).toHaveBeenCalledTimes(1)
    expect(useEffectMock).toHaveBeenCalledWith(expect.any(Function), ['prefs', { theme: 'Light' }])
    expect(saveToStorageMock).toHaveBeenCalledWith('prefs', { theme: 'Light' })
  })
})
