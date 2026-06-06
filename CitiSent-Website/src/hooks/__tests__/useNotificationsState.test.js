/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest'
import { act, createElement, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { useNotificationsState } from '../useNotificationsState'

function renderUseNotificationsState(props) {
  const container = document.createElement('div')
  const root = createRoot(container)
  let hookValue

  function TestHarness() {
    const value = useNotificationsState(props)

    useEffect(() => {
      hookValue = value
    }, [value])

    return null
  }

  act(() => {
    root.render(createElement(TestHarness))
  })

  return {
    get current() {
      return hookValue
    },
    unmount() {
      act(() => {
        root.unmount()
      })
    },
  }
}

describe('useNotificationsState', () => {
  it('returns unread count and toggles target notification', async () => {
    const setNotificationsByAdmin = vi.fn()
    const notificationsByAdmin = {
      'admin-1': [
        { id: 'n1', read: false },
        { id: 'n2', read: true },
      ],
    }

    const rendered = renderUseNotificationsState({
      notificationsByAdmin,
      activeAdminId: 'admin-1',
      setNotificationsByAdmin,
      addActivity: vi.fn(),
      notifySuccess: vi.fn(),
    })

    expect(rendered.current.unreadNotifications).toBe(1)

    await act(async () => {
      await rendered.current.handleToggleNotification('n1')
    })

    expect(setNotificationsByAdmin).toHaveBeenCalledTimes(1)
    const updater = setNotificationsByAdmin.mock.calls[0][0]
    expect(updater(notificationsByAdmin)).toEqual({
      'admin-1': [
        { id: 'n1', read: true },
        { id: 'n2', read: true },
      ],
    })

    rendered.unmount()
  })

  it('clears notifications and triggers activity + success messaging', async () => {
    const setNotificationsByAdmin = vi.fn()
    const addActivity = vi.fn()
    const notifySuccess = vi.fn()

    const rendered = renderUseNotificationsState({
      notificationsByAdmin: { 'admin-1': [{ id: 'n1', read: false }] },
      activeAdminId: 'admin-1',
      setNotificationsByAdmin,
      addActivity,
      notifySuccess,
    })

    await act(async () => {
      await rendered.current.handleClearNotifications()
    })

    expect(setNotificationsByAdmin).toHaveBeenCalledWith({ 'admin-1': [] })
    expect(addActivity).toHaveBeenCalledWith('Notification cleanup', 'Cleared all notifications')
    expect(notifySuccess).toHaveBeenCalledWith('All notifications were cleared.')

    rendered.unmount()
  })
})
