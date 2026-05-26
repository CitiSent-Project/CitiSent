export function toggleNotificationReadState({ notifications, notificationId }) {
  return notifications.map((notification) =>
    notification.id === notificationId
      ? { ...notification, read: !notification.read }
      : notification
  )
}

export function getAdminNotifications({ notificationsByAdmin = {}, adminId }) {
  return notificationsByAdmin[adminId] || []
}

function normalizeNotificationMeta(meta) {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    return undefined
  }

  const normalized = {}

  if (meta.invitation && typeof meta.invitation === 'object' && !Array.isArray(meta.invitation)) {
    normalized.invitation = {
      ...meta.invitation,
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined
}

export function buildNotification({ title, message, type = 'Account', meta, metadata }) {
  const normalizedMeta = normalizeNotificationMeta(meta)

  return {
    id: `notif-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    title,
    message,
    type,
    createdAt: new Date().toISOString(),
    read: false,
    ...(normalizedMeta ? { meta: normalizedMeta } : {}),
    ...(metadata ? { metadata } : {}),
  }
}

export function appendNotificationForAdmin({ notificationsByAdmin = {}, adminId, notification }) {
  const currentNotifications = notificationsByAdmin[adminId] || []

  return {
    ...notificationsByAdmin,
    [adminId]: [notification, ...currentNotifications],
  }
}

export function appendNotificationForAdmins({ notificationsByAdmin = {}, adminIds = [], notification }) {
  return adminIds.reduce(
    (nextState, adminId) => appendNotificationForAdmin({
      notificationsByAdmin: nextState,
      adminId,
      notification: {
        ...notification,
        id: `${notification.id}-${adminId}`,
      },
    }),
    notificationsByAdmin
  )
}

export function toggleAdminNotificationReadState({ notificationsByAdmin = {}, adminId, notificationId }) {
  const currentNotifications = notificationsByAdmin[adminId] || []

  return {
    ...notificationsByAdmin,
    [adminId]: toggleNotificationReadState({
      notifications: currentNotifications,
      notificationId,
    }),
  }
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

export function buildClearAdminNotificationsTransition({ notificationsByAdmin = {}, adminId }) {
  const transition = buildClearNotificationsTransition()

  return {
    ...transition,
    nextNotificationsByAdmin: {
      ...notificationsByAdmin,
      [adminId]: transition.nextNotifications,
    },
  }
}
