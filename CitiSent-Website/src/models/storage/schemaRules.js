import { ADMIN_STORAGE_KEYS } from '../data'
import { APP_PAGES } from '../pageModel'
import { normalizeActivityLog, normalizeTransferRequests } from './activitySchema'
import { normalizeAdminAccounts, normalizeAdminProfile } from './adminProfileSchema'
import { normalizeNotificationsArray, normalizeNotificationsByAdmin } from './notificationsSchema'
import { normalizePreferences } from './preferencesSchema'
import { asBoolean, asString } from './valueNormalizers'

export const STORAGE_SCHEMA_VERSION = 1

function migratePassThrough({ payload }) {
  return payload
}

function normalizeActivePage(value) {
  return Object.values(APP_PAGES).includes(value) ? value : APP_PAGES.DASHBOARD
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
    validate: normalizeNotificationsByAdmin,
  },
  [ADMIN_STORAGE_KEYS.activity]: {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    migrate: migratePassThrough,
    validate: normalizeActivityLog,
  },
  [ADMIN_STORAGE_KEYS.transferRequests]: {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    migrate: migratePassThrough,
    validate: normalizeTransferRequests,
  },
  [ADMIN_STORAGE_KEYS.rememberEmail]: {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    migrate: migratePassThrough,
    validate: (value) => asString(value, ''),
  },
  [ADMIN_STORAGE_KEYS.accessToken]: {
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
    validate: normalizeActivePage,
  },
  [ADMIN_STORAGE_KEYS.selectedReportId]: {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    migrate: migratePassThrough,
    validate: (value) => asString(value, ''),
  },
}

export function getStorageSchemaRule(storageKey) {
  return STORAGE_SCHEMA_RULES[storageKey] || { schemaVersion: STORAGE_SCHEMA_VERSION }
}
