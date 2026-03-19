import { describe, expect, it } from 'vitest'
import {
  appendNotificationForAdmin,
  appendNotificationForAdmins,
  buildClearAdminNotificationsTransition,
  buildNotification,
  buildClearNotificationsTransition,
  countUnreadNotifications,
  getAdminNotifications,
  toggleAdminNotificationReadState,
  toggleNotificationReadState,
} from '../notificationsController'

describe('notificationsController', () => {
  it('toggles only the targeted notification read state', () => {
    const notifications = [
      { id: 'n1', read: false },
      { id: 'n2', read: true },
    ]

    const result = toggleNotificationReadState({
      notifications,
      notificationId: 'n1',
    })

    expect(result).toEqual([
      { id: 'n1', read: true },
      { id: 'n2', read: true },
    ])
  })

  it('counts unread notifications', () => {
    expect(countUnreadNotifications([{ read: false }, { read: true }, { read: false }])).toBe(2)
    expect(countUnreadNotifications()).toBe(0)
  })

  it('builds clear notifications transition payload', () => {
    expect(buildClearNotificationsTransition()).toEqual({
      nextNotifications: [],
      activity: {
        action: 'Notification cleanup',
        detail: 'Cleared all notifications',
      },
      successMessage: 'All notifications were cleared.',
    })
  })

  it('supports fan-out notification operations by admin id', () => {
    const initial = {
      'admin-1': [{ id: 'n1', read: false }],
      'admin-2': [],
    }

    const built = buildNotification({ title: 'Hello', message: 'World' })

    const withSingle = appendNotificationForAdmin({
      notificationsByAdmin: initial,
      adminId: 'admin-2',
      notification: built,
    })

    expect(getAdminNotifications({ notificationsByAdmin: withSingle, adminId: 'admin-2' }).length).toBe(1)

    const withMany = appendNotificationForAdmins({
      notificationsByAdmin: withSingle,
      adminIds: ['admin-1', 'admin-2'],
      notification: built,
    })

    expect(getAdminNotifications({ notificationsByAdmin: withMany, adminId: 'admin-1' }).length).toBe(2)
    expect(getAdminNotifications({ notificationsByAdmin: withMany, adminId: 'admin-2' }).length).toBe(2)
  })

  it('toggles and clears notifications for a specific admin', () => {
    const state = {
      'admin-1': [{ id: 'n1', read: false }],
      'admin-2': [{ id: 'n2', read: false }],
    }

    const toggled = toggleAdminNotificationReadState({
      notificationsByAdmin: state,
      adminId: 'admin-1',
      notificationId: 'n1',
    })

    expect(toggled['admin-1'][0].read).toBe(true)
    expect(toggled['admin-2'][0].read).toBe(false)

    const clearTransition = buildClearAdminNotificationsTransition({
      notificationsByAdmin: toggled,
      adminId: 'admin-1',
    })

    expect(clearTransition.nextNotificationsByAdmin['admin-1']).toEqual([])
    expect(clearTransition.nextNotificationsByAdmin['admin-2']).toEqual([{ id: 'n2', read: false }])
  })
})
