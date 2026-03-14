import { afterEach, describe, expect, it, vi } from 'vitest'
import { APP_PAGES } from '../../models/pageModel'

const effectStore = vi.hoisted(() => ({
  lastCleanup: undefined,
}))

const { useEffectMock } = vi.hoisted(() => ({
  useEffectMock: vi.fn((callback) => {
    effectStore.lastCleanup = callback()
    return effectStore.lastCleanup
  }),
}))

vi.mock('react', () => ({
  useEffect: useEffectMock,
}))

import { usePageLoadingState } from '../usePageLoadingState'

describe('usePageLoadingState', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    effectStore.lastCleanup = undefined
    delete globalThis.window
  })

  it('does not start timer when not authenticated or not loading', () => {
    vi.useFakeTimers()
    const setIsPageLoading = vi.fn()

    usePageLoadingState({
      activePage: APP_PAGES.DASHBOARD,
      isAuthenticated: false,
      isPageLoading: true,
      setIsPageLoading,
      delayMs: 100,
    })

    usePageLoadingState({
      activePage: APP_PAGES.DASHBOARD,
      isAuthenticated: true,
      isPageLoading: false,
      setIsPageLoading,
      delayMs: 100,
    })

    vi.advanceTimersByTime(150)
    expect(setIsPageLoading).not.toHaveBeenCalled()
  })

  it('sets loading to false after delay when authenticated and loading', () => {
    vi.useFakeTimers()
    globalThis.window = globalThis
    const setIsPageLoading = vi.fn()

    usePageLoadingState({
      activePage: APP_PAGES.REPORTS,
      isAuthenticated: true,
      isPageLoading: true,
      setIsPageLoading,
      delayMs: 120,
    })

    expect(setIsPageLoading).not.toHaveBeenCalled()
    vi.advanceTimersByTime(120)
    expect(setIsPageLoading).toHaveBeenCalledWith(false)
  })

  it('provides cleanup that clears timeout', () => {
    vi.useFakeTimers()
    globalThis.window = globalThis
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')

    usePageLoadingState({
      activePage: APP_PAGES.USERS,
      isAuthenticated: true,
      isPageLoading: true,
      setIsPageLoading: vi.fn(),
      delayMs: 200,
    })

    expect(typeof effectStore.lastCleanup).toBe('function')
    effectStore.lastCleanup()
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1)
  })
})
