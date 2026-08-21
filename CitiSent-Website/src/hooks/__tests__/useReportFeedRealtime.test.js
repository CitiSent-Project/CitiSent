/**
 * useReportFeedRealtime tests
 *
 * Strategy: mock socketService and React hooks at the module boundary so we
 * can drive the effect callbacks and timer behaviour synchronously.
 *
 * Key design notes:
 *  - `vi.mock('react', …)` replaces every React hook with a controlled stub.
 *  - `useEffect` immediately runs its callback synchronously so we can assert
 *    on side effects without `await act(…)`.
 *  - `mockSocket` is a shared object; we use `vi.clearAllMocks()` in
 *    `beforeEach` to reset call history between tests.
 *  - `effectStore` tracks the cleanup function returned by each effect so
 *    tests can invoke cleanup explicitly.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ─── Mock socket module ───────────────────────────────────────────────────────
const mockSocket = vi.hoisted(() => ({
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  connected: true,
}))

vi.mock('../../services/socket/socketService', () => ({
  getSocket: vi.fn(() => mockSocket),
}))

// ─── React hook mocks ─────────────────────────────────────────────────────────
// We capture the cleanup function returned by each useEffect callback.
let lastEffectCleanup = null

vi.mock('react', () => ({
  useEffect: vi.fn((callback) => {
    const cleanup = callback()
    if (typeof cleanup === 'function') {
      lastEffectCleanup = cleanup
    }
  }),
  useRef: vi.fn((initialValue) => ({ current: initialValue })),
  useCallback: vi.fn((fn) => fn),
}))

import { useReportFeedRealtime } from '../useReportFeedRealtime'
import { getSocket } from '../../services/socket/socketService'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Return the handler bound to a given event via mockSocket.on */
function getHandler(event) {
  const call = mockSocket.on.mock.calls.find(([e]) => e === event)
  return call ? call[1] : undefined
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useReportFeedRealtime', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    lastEffectCleanup = null
    // Restore getSocket to always return the shared mockSocket
    getSocket.mockReturnValue(mockSocket)
  })

  afterEach(() => {
    if (typeof lastEffectCleanup === 'function') {
      lastEffectCleanup()
    }
    vi.useRealTimers()
  })

  // ── Enabled / disabled guards ───────────────────────────────────────────────

  it('emits join_report_feed on mount', () => {
    useReportFeedRealtime({ accessToken: 'token-1', onInvalidate: vi.fn(), enabled: true })
    expect(mockSocket.emit).toHaveBeenCalledWith('join_report_feed', {})
  })

  it('registers report_feed_changed and connect listeners', () => {
    useReportFeedRealtime({ accessToken: 'token-1', onInvalidate: vi.fn(), enabled: true })
    const events = mockSocket.on.mock.calls.map(([e]) => e)
    expect(events).toContain('report_feed_changed')
    expect(events).toContain('connect')
  })

  it('does not subscribe when disabled', () => {
    useReportFeedRealtime({ accessToken: 'token-1', onInvalidate: vi.fn(), enabled: false })
    // When disabled the subscription effect exits early – no emit or on calls.
    expect(mockSocket.emit).not.toHaveBeenCalled()
    expect(mockSocket.on).not.toHaveBeenCalled()
  })

  it('does not subscribe without accessToken', () => {
    useReportFeedRealtime({ accessToken: '', onInvalidate: vi.fn(), enabled: true })
    expect(mockSocket.emit).not.toHaveBeenCalled()
    expect(mockSocket.on).not.toHaveBeenCalled()
  })

  it('does not subscribe when getSocket returns null', () => {
    getSocket.mockReturnValueOnce(null)
    useReportFeedRealtime({ accessToken: 'token-1', onInvalidate: vi.fn(), enabled: true })
    expect(mockSocket.on).not.toHaveBeenCalled()
  })

  // ── Cleanup ─────────────────────────────────────────────────────────────────

  it('cleans up listeners on unmount', () => {
    useReportFeedRealtime({ accessToken: 'token-1', onInvalidate: vi.fn(), enabled: true })
    expect(typeof lastEffectCleanup).toBe('function')

    lastEffectCleanup()
    lastEffectCleanup = null // prevent afterEach from running it twice

    const offEvents = mockSocket.off.mock.calls.map(([e]) => e)
    expect(offEvents).toContain('report_feed_changed')
    expect(offEvents).toContain('connect')
  })

  // ── Debouncing ──────────────────────────────────────────────────────────────

  it('debounces rapid events into one invalidation', () => {
    vi.useFakeTimers()
    const onInvalidate = vi.fn()

    useReportFeedRealtime({ accessToken: 'token-1', onInvalidate, enabled: true })

    const handler = getHandler('report_feed_changed')
    expect(handler).toBeTruthy()

    // Fire 3 rapid events inside the debounce window.
    handler({ reportId: 'r1', changeType: 'created', scope: 'global', scopeId: null })
    handler({ reportId: 'r2', changeType: 'created', scope: 'global', scopeId: null })
    handler({ reportId: 'r3', changeType: 'created', scope: 'global', scopeId: null })

    // Still inside the debounce window – should not have called invalidate yet.
    expect(onInvalidate).not.toHaveBeenCalled()

    // Advance past debounce delay (800 ms).
    vi.advanceTimersByTime(900)
    expect(onInvalidate).toHaveBeenCalledTimes(1)
  })

  // ── shouldHandle predicate ──────────────────────────────────────────────────

  it('respects shouldHandle predicate – ignores non-matching events', () => {
    vi.useFakeTimers()
    const onInvalidate = vi.fn()

    useReportFeedRealtime({
      accessToken: 'token-1',
      onInvalidate,
      shouldHandle: (payload) => payload?.scope === 'user' && payload?.scopeId === 'user-1',
      enabled: true,
    })

    const handler = getHandler('report_feed_changed')

    // Event for a different user – should be ignored.
    handler({ reportId: 'r1', changeType: 'created', scope: 'user', scopeId: 'user-2' })
    vi.advanceTimersByTime(900)
    expect(onInvalidate).not.toHaveBeenCalled()
  })

  it('respects shouldHandle predicate – fires for matching events', () => {
    vi.useFakeTimers()
    const onInvalidate = vi.fn()

    useReportFeedRealtime({
      accessToken: 'token-1',
      onInvalidate,
      shouldHandle: (payload) => payload?.scope === 'user' && payload?.scopeId === 'user-1',
      enabled: true,
    })

    const handler = getHandler('report_feed_changed')

    // Event for the matching user – should trigger invalidation.
    handler({ reportId: 'r2', changeType: 'created', scope: 'user', scopeId: 'user-1' })
    vi.advanceTimersByTime(900)
    expect(onInvalidate).toHaveBeenCalledTimes(1)
  })

  // ── Reconnect recovery ──────────────────────────────────────────────────────

  it('re-emits join_report_feed and invalidates once on reconnect', () => {
    const onInvalidate = vi.fn()

    useReportFeedRealtime({ accessToken: 'token-1', onInvalidate, enabled: true })

    // join_report_feed is emitted once on mount.
    const joinCallsBefore = mockSocket.emit.mock.calls.filter(([e]) => e === 'join_report_feed')
    expect(joinCallsBefore.length).toBe(1)

    // Simulate reconnect.
    const reconnectHandler = getHandler('connect')
    expect(reconnectHandler).toBeTruthy()
    reconnectHandler()

    // Should have emitted join_report_feed again.
    const joinCallsAfter = mockSocket.emit.mock.calls.filter(([e]) => e === 'join_report_feed')
    expect(joinCallsAfter.length).toBe(2)

    // Should have called invalidate once for reconnect recovery.
    expect(onInvalidate).toHaveBeenCalledTimes(1)
  })
})
