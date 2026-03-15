import { describe, expect, it } from 'vitest'
import {
  buildClearNotificationsTransition,
  countUnreadNotifications,
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
})
