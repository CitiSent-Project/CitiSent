import { describe, expect, it } from 'vitest'
import { ADMIN_STORAGE_KEYS, DEFAULT_PREFERENCES } from '../data'
import { getStorageSchemaRule } from '../storageSchemaModel'

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
