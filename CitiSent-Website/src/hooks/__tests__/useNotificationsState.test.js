import { describe, expect, it, vi } from 'vitest'
import { useNotificationsState } from '../useNotificationsState'

describe('useNotificationsState', () => {
  it('returns unread count and toggles target notification', () => {
    const setNotificationsByAdmin = vi.fn()
    const notificationsByAdmin = {
      'admin-1': [
        { id: 'n1', read: false },
        { id: 'n2', read: true },
      ],
    }

    const { unreadNotifications, handleToggleNotification } = useNotificationsState({
      notificationsByAdmin,
      activeAdminId: 'admin-1',
      setNotificationsByAdmin,
      addActivity: vi.fn(),
      notifySuccess: vi.fn(),
    })

    expect(unreadNotifications).toBe(1)

    handleToggleNotification('n1')

    expect(setNotificationsByAdmin).toHaveBeenCalledTimes(1)
    const updater = setNotificationsByAdmin.mock.calls[0][0]
    expect(updater(notificationsByAdmin)).toEqual({
      'admin-1': [
        { id: 'n1', read: true },
        { id: 'n2', read: true },
      ],
    })
  })

  it('clears notifications and triggers activity + success messaging', () => {
    const setNotificationsByAdmin = vi.fn()
    const addActivity = vi.fn()
    const notifySuccess = vi.fn()

    const { handleClearNotifications } = useNotificationsState({
      notificationsByAdmin: { 'admin-1': [{ id: 'n1', read: false }] },
      activeAdminId: 'admin-1',
      setNotificationsByAdmin,
      addActivity,
      notifySuccess,
    })

    handleClearNotifications()

    expect(setNotificationsByAdmin).toHaveBeenCalledWith({ 'admin-1': [] })
    expect(addActivity).toHaveBeenCalledWith('Notification cleanup', 'Cleared all notifications')
    expect(notifySuccess).toHaveBeenCalledWith('All notifications were cleared.')
  })
})
