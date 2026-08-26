import { DEFAULT_PREFERENCES } from '../data'
import { asBoolean, asNumber, asString, isObject } from './valueNormalizers'

export function normalizePreferences(preferences) {
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
    newReports: asBoolean(source.newReports, DEFAULT_PREFERENCES.newReports),
    escalatedReports: asBoolean(source.escalatedReports, DEFAULT_PREFERENCES.escalatedReports),
    summaryEmails: asBoolean(source.summaryEmails, DEFAULT_PREFERENCES.summaryEmails),
    theme: asString(source.theme, DEFAULT_PREFERENCES.theme),
    fontSize: asString(source.fontSize, DEFAULT_PREFERENCES.fontSize),
    animationsEnabled: asBoolean(source.animationsEnabled, DEFAULT_PREFERENCES.animationsEnabled),
    sessionTimeout: asNumber(source.sessionTimeout, DEFAULT_PREFERENCES.sessionTimeout),
    reportsPerPage: asNumber(source.reportsPerPage, DEFAULT_PREFERENCES.reportsPerPage),
    defaultSorting: asString(source.defaultSorting, DEFAULT_PREFERENCES.defaultSorting),
    anonymousReports: asBoolean(source.anonymousReports, DEFAULT_PREFERENCES.anonymousReports),
    autoCloseReports: asBoolean(source.autoCloseReports, DEFAULT_PREFERENCES.autoCloseReports),
    auditTrackingEnabled: asBoolean(
      source.auditTrackingEnabled,
      DEFAULT_PREFERENCES.auditTrackingEnabled
    ),
    timezone: asString(source.timezone, DEFAULT_PREFERENCES.timezone),
  }
}
