import { useEffect, useRef, useCallback } from 'react'
import { getSocket } from '../../services/socket/socketService'

/**
 * Debounce delay (ms) – bursts of report_feed_changed events within this
 * window are collapsed into a single invalidation callback.
 */
const DEBOUNCE_MS = 800

/**
 * useReportFeedRealtime
 *
 * Subscribes to the `report_feed_changed` Socket.IO event and calls
 * `onInvalidate` when a matching event is received.
 *
 * Features:
 * - Debounces bursts of events into one invalidation call.
 * - Refetches once on socket reconnection (to recover missed events).
 * - Symmetric listener cleanup on unmount.
 * - Emits `join_report_feed` so the server places this socket into
 *   the correct scoped rooms based on the authenticated user's role.
 *
 * @param {object} options
 * @param {string}   options.accessToken   – current session token.
 * @param {function} options.onInvalidate  – called when reports should be refetched.
 * @param {function} [options.shouldHandle] – optional predicate receiving the event
 *                                            payload; return false to ignore the event.
 * @param {boolean}  [options.enabled=true] – set to false to skip subscription.
 */
export function useReportFeedRealtime({
  accessToken,
  onInvalidate,
  shouldHandle,
  enabled = true,
}) {
  // Keep stable references to the latest callbacks without requiring
  // re-subscription when the identity of the callback changes.
  const onInvalidateRef = useRef(onInvalidate)
  const shouldHandleRef = useRef(shouldHandle)

  useEffect(() => {
    onInvalidateRef.current = onInvalidate
  }, [onInvalidate])

  useEffect(() => {
    shouldHandleRef.current = shouldHandle
  }, [shouldHandle])

  const stableInvalidate = useCallback(() => {
    onInvalidateRef.current?.()
  }, [])

  useEffect(() => {
    if (!enabled || !accessToken) {
      return undefined
    }

    const socket = getSocket(accessToken)
    if (!socket) {
      return undefined
    }

    // Request server-validated feed room membership.
    socket.emit('join_report_feed', {})

    // --- Debounced event handler ---
    let debounceTimer = null

    function handleFeedChanged(payload) {
      // Allow consumers to filter events (e.g. only for a specific user).
      if (typeof shouldHandleRef.current === 'function') {
        if (!shouldHandleRef.current(payload)) {
          return
        }
      }

      // Debounce: collapse rapid events into one invalidation.
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer)
      }

      debounceTimer = setTimeout(() => {
        debounceTimer = null
        stableInvalidate()
      }, DEBOUNCE_MS)
    }

    // --- Reconnect handler ---
    // After a socket reconnection, re-join feed rooms and refetch once
    // because events may have been missed while disconnected.
    function handleReconnect() {
      socket.emit('join_report_feed', {})
      stableInvalidate()
    }

    socket.on('report_feed_changed', handleFeedChanged)
    socket.on('connect', handleReconnect)

    return () => {
      socket.off('report_feed_changed', handleFeedChanged)
      socket.off('connect', handleReconnect)

      if (debounceTimer !== null) {
        clearTimeout(debounceTimer)
        debounceTimer = null
      }
    }
  }, [accessToken, enabled, stableInvalidate])
}
