import { asArray, asBoolean, asObject, asString, isObject } from './valueNormalizers'

function normalizeNotificationMeta(meta) {
  const source = asObject(meta, null)

  if (!source) {
    return undefined
  }

  const invitation = normalizeNotificationMetadata(source.invitation)
  return invitation ? { invitation } : undefined
}

function normalizeNotificationMetadata(payload) {
  const source = asObject(payload, null)

  if (!source) {
    return undefined
  }

  const kind = asString(source.kind)
  if (kind !== 'accountInvitation') {
    return undefined
  }

  const status = asString(source.status, 'pending')
  if (status !== 'pending' && status !== 'active') {
    return undefined
  }

  return {
    kind,
    email: asString(source.email),
    status,
  }
}

export function normalizeNotification(notification, fallbackIdPrefix = 'notif') {
  const source = isObject(notification) ? notification : {}
  const normalizedMeta = normalizeNotificationMeta(source.meta)
  const metadata = normalizeNotificationMetadata(source.metadata)

  return {
    id: asString(source.id, `${fallbackIdPrefix}-${Date.now()}`),
    title: asString(source.title, 'Notification'),
    message: asString(source.message, ''),
    type: asString(source.type, 'General'),
    createdAt: asString(source.createdAt, new Date().toISOString()),
    read: asBoolean(source.read, false),
    ...(normalizedMeta ? { meta: normalizedMeta } : {}),
    ...(metadata ? { metadata } : {}),
  }
}

export function normalizeNotificationsArray(notifications) {
  return asArray(notifications, []).map((entry) => normalizeNotification(entry))
}

export function normalizeNotificationsByAdmin(notificationsByAdmin) {
  const source = asObject(notificationsByAdmin, {})
  const adminIds = Array.from(new Set(Object.keys(source)))

  return adminIds.reduce((accumulator, adminId) => {
    accumulator[adminId] = normalizeNotificationsArray(source[adminId]).map((notification) => ({
      ...notification,
      id: notification.id || `notif-${adminId}-${Date.now()}`,
    }))
    return accumulator
  }, {})
}
