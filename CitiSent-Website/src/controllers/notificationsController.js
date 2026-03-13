export function toggleNotificationReadState({ notifications, notificationId }) {
  return notifications.map((notification) =>
    notification.id === notificationId
      ? { ...notification, read: !notification.read }
      : notification
  )
}

export function countUnreadNotifications(notifications = []) {
  return notifications.filter((notification) => !notification.read).length
}

export function buildClearNotificationsTransition() {
  return {
    nextNotifications: [],
    activity: {
      action: 'Notification cleanup',
      detail: 'Cleared all notifications',
    },
    successMessage: 'All notifications were cleared.',
  }
}
