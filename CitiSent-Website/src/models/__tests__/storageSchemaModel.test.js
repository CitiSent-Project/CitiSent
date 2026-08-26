import { describe, expect, it } from 'vitest'
import {
  ADMIN_STORAGE_KEYS,
  DEFAULT_ADMIN_ACCOUNTS,
  DEFAULT_PREFERENCES,
  DEFAULT_TRANSFER_REQUESTS,
} from '../data'
import {
  getStorageSchemaRule,
  STORAGE_SCHEMA_RULES,
  STORAGE_SCHEMA_VERSION,
} from '../storageSchemaModel'

const SCHEMA_BACKED_KEYS = [
  ADMIN_STORAGE_KEYS.profile,
  ADMIN_STORAGE_KEYS.adminAccounts,
  ADMIN_STORAGE_KEYS.preferences,
  ADMIN_STORAGE_KEYS.notifications,
  ADMIN_STORAGE_KEYS.notificationsByAdmin,
  ADMIN_STORAGE_KEYS.activity,
  ADMIN_STORAGE_KEYS.transferRequests,
  ADMIN_STORAGE_KEYS.rememberEmail,
  ADMIN_STORAGE_KEYS.accessToken,
  ADMIN_STORAGE_KEYS.authSession,
  ADMIN_STORAGE_KEYS.activePage,
  ADMIN_STORAGE_KEYS.selectedReportId,
]

describe('storageSchemaModel preferences', () => {
  it('adds new settings defaults when stored preferences are from an older shape', () => {
    const rule = getStorageSchemaRule(ADMIN_STORAGE_KEYS.preferences)
    const normalized = rule.validate({
      theme: 'Dark',
      fontSize: 'Large',
      sessionTimeout: 15,
    })

    expect(normalized).toMatchObject({
      theme: 'Dark',
      fontSize: 'Large',
      sessionTimeout: 15,
      newReports: DEFAULT_PREFERENCES.newReports,
      escalatedReports: DEFAULT_PREFERENCES.escalatedReports,
      summaryEmails: DEFAULT_PREFERENCES.summaryEmails,
      reportsPerPage: DEFAULT_PREFERENCES.reportsPerPage,
      defaultSorting: DEFAULT_PREFERENCES.defaultSorting,
      anonymousReports: DEFAULT_PREFERENCES.anonymousReports,
      autoCloseReports: DEFAULT_PREFERENCES.autoCloseReports,
      auditTrackingEnabled: DEFAULT_PREFERENCES.auditTrackingEnabled,
      timezone: DEFAULT_PREFERENCES.timezone,
    })
  })

  it('rejects malformed preference field values and keeps safe defaults', () => {
    const rule = getStorageSchemaRule(ADMIN_STORAGE_KEYS.preferences)
    const normalized = rule.validate({
      newReports: 'yes',
      reportsPerPage: '24',
      auditTrackingEnabled: null,
      timezone: 123,
    })

    expect(normalized.newReports).toBe(DEFAULT_PREFERENCES.newReports)
    expect(normalized.reportsPerPage).toBe(DEFAULT_PREFERENCES.reportsPerPage)
    expect(normalized.auditTrackingEnabled).toBe(DEFAULT_PREFERENCES.auditTrackingEnabled)
    expect(normalized.timezone).toBe(DEFAULT_PREFERENCES.timezone)
  })
})

describe('storageSchemaModel registry', () => {
  it('keeps every schema-backed key on the current version with pass-through migration', () => {
    expect(Object.keys(STORAGE_SCHEMA_RULES)).toEqual(SCHEMA_BACKED_KEYS)

    SCHEMA_BACKED_KEYS.forEach((storageKey) => {
      const rule = getStorageSchemaRule(storageKey)
      const payload = { storageKey }

      expect(rule.schemaVersion).toBe(STORAGE_SCHEMA_VERSION)
      expect(rule.migrate({ payload, fromVersion: 0, toVersion: STORAGE_SCHEMA_VERSION })).toBe(payload)
      expect(typeof rule.validate).toBe('function')
    })
  })

  it('returns a version-only rule for storage keys without a schema', () => {
    expect(getStorageSchemaRule(ADMIN_STORAGE_KEYS.settingsActiveTab)).toEqual({
      schemaVersion: STORAGE_SCHEMA_VERSION,
    })
  })
})

describe('storageSchemaModel entity validators', () => {
  it('normalizes profiles and accounts without changing valid profile data', () => {
    const profileRule = getStorageSchemaRule(ADMIN_STORAGE_KEYS.profile)
    const accountRule = getStorageSchemaRule(ADMIN_STORAGE_KEYS.adminAccounts)
    const profile = {
      id: 'admin-1',
      fullName: 'Ana M Reyes',
      email: 'ana@example.com',
      departmentId: 'health',
      role: 'Office Admin',
      lastLoginAt: '2026-08-26T12:00:00.000Z',
    }

    expect(profileRule.validate(profile)).toMatchObject({
      ...profile,
      fname: 'Ana',
      mname: 'M',
      lname: 'Reyes',
    })
    expect(accountRule.validate([profile])).toHaveLength(1)
    expect(accountRule.validate([])).toBe(DEFAULT_ADMIN_ACCOUNTS)
  })

  it('normalizes notification, activity, and transfer collections', () => {
    const notificationRule = getStorageSchemaRule(ADMIN_STORAGE_KEYS.notifications)
    const notificationsByAdminRule = getStorageSchemaRule(ADMIN_STORAGE_KEYS.notificationsByAdmin)
    const activityRule = getStorageSchemaRule(ADMIN_STORAGE_KEYS.activity)
    const transferRule = getStorageSchemaRule(ADMIN_STORAGE_KEYS.transferRequests)
    const notification = {
      id: 'notification-1',
      title: 'Invitation',
      message: 'Review account invitation',
      type: 'Account',
      createdAt: '2026-08-26T12:00:00.000Z',
      read: false,
      metadata: { kind: 'accountInvitation', email: 'ana@example.com', status: 'pending' },
    }

    expect(notificationRule.validate([notification])).toEqual([notification])
    expect(notificationsByAdminRule.validate({ 'admin-1': [notification] })).toEqual({
      'admin-1': [notification],
    })
    expect(activityRule.validate([{ id: 'activity-1', action: 'Signed in', detail: 'Dashboard opened', createdAt: '2026-08-26' }]))
      .toEqual([{ id: 'activity-1', action: 'Signed in', detail: 'Dashboard opened', createdAt: '2026-08-26' }])
    expect(transferRule.validate([])).toBe(DEFAULT_TRANSFER_REQUESTS)
  })

  it('keeps primitive storage values type-safe and falls back safely', () => {
    expect(getStorageSchemaRule(ADMIN_STORAGE_KEYS.rememberEmail).validate('ana@example.com')).toBe('ana@example.com')
    expect(getStorageSchemaRule(ADMIN_STORAGE_KEYS.rememberEmail).validate(null)).toBe('')
    expect(getStorageSchemaRule(ADMIN_STORAGE_KEYS.accessToken).validate(42)).toBe('')
    expect(getStorageSchemaRule(ADMIN_STORAGE_KEYS.authSession).validate(true)).toBe(true)
    expect(getStorageSchemaRule(ADMIN_STORAGE_KEYS.authSession).validate('true')).toBe(false)
    expect(getStorageSchemaRule(ADMIN_STORAGE_KEYS.activePage).validate('not-a-page')).toBe('Dashboard')
    expect(getStorageSchemaRule(ADMIN_STORAGE_KEYS.selectedReportId).validate('report-1')).toBe('report-1')
  })
})
