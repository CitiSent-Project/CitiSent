import { describe, expect, it, vi } from 'vitest'
import { useNotificationsState } from '../useNotificationsState'

describe('useNotificationsState', () => {
  it('returns unread count and toggles target notification', () => {
    const setNotifications = vi.fn()
    const notifications = [
      { id: 'n1', read: false },
      { id: 'n2', read: true },
    ]

    const { unreadNotifications, handleToggleNotification } = useNotificationsState({
      notifications,
      setNotifications,
      addActivity: vi.fn(),
      notifySuccess: vi.fn(),
    })

    expect(unreadNotifications).toBe(1)

    handleToggleNotification('n1')

    expect(setNotifications).toHaveBeenCalledTimes(1)
    const updater = setNotifications.mock.calls[0][0]
    expect(updater(notifications)).toEqual([
      { id: 'n1', read: true },
      { id: 'n2', read: true },
    ])
  })

  it('clears notifications and triggers activity + success messaging', () => {
    const setNotifications = vi.fn()
    const addActivity = vi.fn()
    const notifySuccess = vi.fn()

    const { handleClearNotifications } = useNotificationsState({
      notifications: [{ id: 'n1', read: false }],
      setNotifications,
      addActivity,
      notifySuccess,
    })

    handleClearNotifications()

    expect(setNotifications).toHaveBeenCalledWith([])
    expect(addActivity).toHaveBeenCalledWith('Notification cleanup', 'Cleared all notifications')
    expect(notifySuccess).toHaveBeenCalledWith('All notifications were cleared.')
  })
})
