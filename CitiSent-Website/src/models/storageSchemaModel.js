import {
  ADMIN_STORAGE_KEYS,
  DEFAULT_ADMIN_ACCOUNTS,
  DEFAULT_ADMIN_PROFILE,
  DEFAULT_NOTIFICATIONS,
  DEFAULT_PREFERENCES,
  DEFAULT_TRANSFER_REQUESTS,
  buildDefaultNotificationsByAdmin,
} from './data'
import { APP_PAGES } from './pageModel'

export const STORAGE_SCHEMA_VERSION = 1

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function asString(value, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function asBoolean(value, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function asArray(value, fallback = []) {
  return Array.isArray(value) ? value : fallback
}

function asObject(value, fallback = {}) {
  return isObject(value) ? value : fallback
}

function normalizeAdminProfile(profile) {
  const source = isObject(profile) ? profile : {}
  return {
    ...DEFAULT_ADMIN_PROFILE,
    ...source,
    id: asString(source.id, DEFAULT_ADMIN_PROFILE.id),
    fullName: asString(source.fullName, DEFAULT_ADMIN_PROFILE.fullName),
    email: asString(source.email, DEFAULT_ADMIN_PROFILE.email),
    departmentId: asString(source.departmentId, DEFAULT_ADMIN_PROFILE.departmentId),
    department: asString(source.department, DEFAULT_ADMIN_PROFILE.department),
    role: asString(source.role, DEFAULT_ADMIN_PROFILE.role),
    phone: asString(source.phone, DEFAULT_ADMIN_PROFILE.phone),
    address: asString(source.address, DEFAULT_ADMIN_PROFILE.address),
    password: asString(source.password, DEFAULT_ADMIN_PROFILE.password),
    joinedAt: asString(source.joinedAt, DEFAULT_ADMIN_PROFILE.joinedAt),
    lastLoginAt: asString(source.lastLoginAt, ''),
  }
}

function normalizeAdminAccounts(accounts) {
  const normalized = asArray(accounts, []).map(normalizeAdminProfile)
  return normalized.length > 0 ? normalized : DEFAULT_ADMIN_ACCOUNTS
}

function normalizePreferences(preferences) {
  const source = isObject(preferences) ? preferences : {}
  return {
    ...DEFAULT_PREFERENCES,
    ...source,
    displayName: asString(source.displayName, DEFAULT_PREFERENCES.displayName),
    department: asString(source.department, DEFAULT_PREFERENCES.department),
    notificationsEnabled: asBoolean(source.notificationsEnabled, DEFAULT_PREFERENCES.notificationsEnabled),
    digestFrequency: asString(source.digestFrequency, DEFAULT_PREFERENCES.digestFrequency),
    reportStatusUpdates: asBoolean(source.reportStatusUpdates, DEFAULT_PREFERENCES.reportStatusUpdates),
    adminInvitations: asBoolean(source.adminInvitations, DEFAULT_PREFERENCES.adminInvitations),
    theme: asString(source.theme, DEFAULT_PREFERENCES.theme),
    fontSize: asString(source.fontSize, DEFAULT_PREFERENCES.fontSize),
    animationsEnabled: asBoolean(source.animationsEnabled, DEFAULT_PREFERENCES.animationsEnabled),
    sessionTimeout:
      typeof source.sessionTimeout === 'number'
        ? source.sessionTimeout
        : DEFAULT_PREFERENCES.sessionTimeout,
  }
}

function normalizeNotification(notification, fallbackIdPrefix = 'notif') {
  const source = isObject(notification) ? notification : {}

  return {
    id: asString(source.id, `${fallbackIdPrefix}-${Date.now()}`),
    title: asString(source.title, 'Notification'),
    message: asString(source.message, ''),
    type: asString(source.type, 'General'),
    createdAt: asString(source.createdAt, new Date().toISOString()),
    read: asBoolean(source.read, false),
  }
}

function normalizeNotificationsArray(notifications) {
  const normalized = asArray(notifications, []).map((entry) => normalizeNotification(entry))
  return normalized.length > 0 ? normalized : DEFAULT_NOTIFICATIONS
}

function normalizeNotificationsByAdmin(notificationsByAdmin, adminAccounts) {
  const seeded = buildDefaultNotificationsByAdmin(adminAccounts)
  const source = asObject(notificationsByAdmin, {})

  return Object.keys(seeded).reduce((accumulator, adminId) => {
    accumulator[adminId] = normalizeNotificationsArray(source[adminId]).map((notification) => ({
      ...notification,
      id: notification.id || `notif-${adminId}-${Date.now()}`,
    }))
    return accumulator
  }, {})
}

function normalizeTransferRequest(entry) {
  const source = isObject(entry) ? entry : {}
  return {
    ...source,
    id: asString(source.id, `transfer-${Date.now()}`),
    adminId: asString(source.adminId),
    adminName: asString(source.adminName),
    currentDepartmentId: asString(source.currentDepartmentId),
    currentDepartmentLabel: asString(source.currentDepartmentLabel),
    requestedDepartmentId: asString(source.requestedDepartmentId),
    requestedDepartmentLabel: asString(source.requestedDepartmentLabel),
    reason: asString(source.reason),
    status: asString(source.status, 'Pending'),
    requestedAt: asString(source.requestedAt, new Date().toISOString()),
    reviewedAt: asString(source.reviewedAt, ''),
    reviewerId: asString(source.reviewerId, ''),
    reviewerName: asString(source.reviewerName, ''),
    reviewNotes: asString(source.reviewNotes, ''),
  }
}

function normalizeActivityEntry(entry) {
  const source = isObject(entry) ? entry : {}
  return {
    id: asString(source.id, `activity-${Date.now()}`),
    action: asString(source.action, 'Activity'),
    detail: asString(source.detail, ''),
    createdAt: asString(source.createdAt, new Date().toISOString()),
  }
}

function migratePassThrough({ payload }) {
  return payload
}

export const STORAGE_SCHEMA_RULES = {
  [ADMIN_STORAGE_KEYS.profile]: {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    migrate: migratePassThrough,
    validate: normalizeAdminProfile,
  },
  [ADMIN_STORAGE_KEYS.adminAccounts]: {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    migrate: migratePassThrough,
    validate: normalizeAdminAccounts,
  },
  [ADMIN_STORAGE_KEYS.preferences]: {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    migrate: migratePassThrough,
    validate: normalizePreferences,
  },
  [ADMIN_STORAGE_KEYS.notifications]: {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    migrate: migratePassThrough,
    validate: normalizeNotificationsArray,
  },
  [ADMIN_STORAGE_KEYS.notificationsByAdmin]: {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    migrate: migratePassThrough,
    validate: (value) =>
      normalizeNotificationsByAdmin(value, normalizeAdminAccounts(DEFAULT_ADMIN_ACCOUNTS)),
  },
  [ADMIN_STORAGE_KEYS.activity]: {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    migrate: migratePassThrough,
    validate: (value) => asArray(value, []).map(normalizeActivityEntry),
  },
  [ADMIN_STORAGE_KEYS.transferRequests]: {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    migrate: migratePassThrough,
    validate: (value) => {
      const normalized = asArray(value, []).map(normalizeTransferRequest)
      return normalized.length > 0 ? normalized : DEFAULT_TRANSFER_REQUESTS
    },
  },
  [ADMIN_STORAGE_KEYS.rememberEmail]: {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    migrate: migratePassThrough,
    validate: (value) => asString(value, ''),
  },
  [ADMIN_STORAGE_KEYS.authSession]: {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    migrate: migratePassThrough,
    validate: (value) => asBoolean(value, false),
  },
  [ADMIN_STORAGE_KEYS.activePage]: {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    migrate: migratePassThrough,
    validate: (value) => (Object.values(APP_PAGES).includes(value) ? value : APP_PAGES.DASHBOARD),
  },
}

export function getStorageSchemaRule(storageKey) {
  return STORAGE_SCHEMA_RULES[storageKey] || { schemaVersion: STORAGE_SCHEMA_VERSION }
}
