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

/**
 * Builds a 'Message'-type notification for the admin notification drawer
 * when a citizen sends a new message in a report conversation.
 *
 * @param {object} options
 * @param {string} options.senderName   - Display name of the message sender (citizen).
 * @param {string} options.messageText  - Raw content of the incoming message.
 * @param {string} options.reportId     - ID of the associated report.
 * @param {string} options.reportNumber - Human-readable report reference (e.g. "RPT-001").
 */
export function buildMessageNotification({ senderName, messageText, reportId, reportNumber }) {
  const truncatedMessage =
    String(messageText || '').length > 120
      ? String(messageText).slice(0, 120) + '…'
      : String(messageText || '')

  return buildNotification({
    title: `New message from ${senderName || 'Citizen'}`,
    message: truncatedMessage,
    type: 'Message',
    metadata: {
      reportId: reportId || null,
      reportNumber: reportNumber || null,
      senderName: senderName || 'Citizen',
    },
  })
}

/**
 * Deduplication guard for message notifications.
 *
 * Returns true when the admin already has at least one unread 'Message'-type
 * notification for the given report, meaning another notification for the same
 * conversation thread should NOT be created (only the unread count should grow).
 *
 * @param {object} options
 * @param {object} options.notificationsByAdmin - The full notifications-by-admin map.
 * @param {string} options.adminId              - The admin whose notifications to check.
 * @param {string} options.reportId             - The report conversation ID.
 */
export function hasUnreadMessageNotificationForReport({ notificationsByAdmin = {}, adminId, reportId }) {
  const adminNotifications = notificationsByAdmin[adminId] || []
  const normalizedReportId = String(reportId || '')

  return adminNotifications.some(
    (notification) =>
      !notification.read &&
      String(notification.type || '').toLowerCase() === 'message' &&
      String(notification.metadata?.reportId || '') === normalizedReportId
  )
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
