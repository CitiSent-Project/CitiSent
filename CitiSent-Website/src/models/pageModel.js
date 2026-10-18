export const APP_PAGES = {
  DASHBOARD: 'Dashboard',
  ADMIN_MANAGEMENT: 'Admin Management',
  USERS: 'Users',
  USER_PROFILE: 'User Profile',
  REPORTS: 'Reports',
  REPORTS_BY_CATEGORY: 'Reports:By Category',
  REPORTS_BY_URGENCY: 'Reports:By Urgency Levels',
  REPORTS_HISTORY: 'Reports:History',
  REPORT_DETAIL: 'Report Detail',
  CONVERSATIONS: 'Conversations',
  ADMIN_PROFILE: 'Admin Profile',
  NOTIFICATIONS: 'Notifications',
  SETTINGS: 'Settings',
  SETTINGS_APPEARANCE: 'Settings:Appearance',
  SETTINGS_SECURITY: 'Settings:Security',
  SETTINGS_NOTIFICATIONS: 'Settings:Notifications',
  SETTINGS_REPORT_MANAGEMENT: 'Settings:Report Management',
  SETTINGS_AUDIT_LOGS: 'Settings:Audit & Logs',
  SETTINGS_SYSTEM: 'Settings:System',
  SETTINGS_PRIVACY_TERMS: 'Settings:Privacy & Terms',
  LOGOUT: 'Logout',
}

export const AUTH_PAGES = {
  LOGIN: 'Login',
}

export const REPORT_SECTIONS = {
  CATEGORY: 'category',
  URGENCY: 'urgency',
  HISTORY: 'history',
}

export const SETTINGS_SECTIONS = {
  APPEARANCE: 'Appearance',
  SECURITY: 'Security',
  NOTIFICATIONS: 'Notifications',
  REPORT_MANAGEMENT: 'Report Management',
  AUDIT_LOGS: 'Audit & Logs',
  SYSTEM: 'System',
  PRIVACY_TERMS: 'Privacy & Terms',
}

/**
 * Clean URL route paths for each application page key.
 * Used for HTML5 browser history synchronization and deep linking.
 */
export const PAGE_ROUTES = {
  [APP_PAGES.DASHBOARD]: '/dashboard',
  [APP_PAGES.ADMIN_MANAGEMENT]: '/admin-management',
  [APP_PAGES.USERS]: '/users',
  [APP_PAGES.USER_PROFILE]: '/users/:id',
  [APP_PAGES.REPORTS_BY_CATEGORY]: '/reports/category',
  [APP_PAGES.REPORTS_BY_URGENCY]: '/reports/urgency',
  [APP_PAGES.REPORTS_HISTORY]: '/reports/history',
  [APP_PAGES.REPORT_DETAIL]: '/reports/:id',
  [APP_PAGES.CONVERSATIONS]: '/conversations',
  [APP_PAGES.ADMIN_PROFILE]: '/admin-profile',
  [APP_PAGES.NOTIFICATIONS]: '/notifications',
  [APP_PAGES.SETTINGS]: '/settings',
  [APP_PAGES.SETTINGS_APPEARANCE]: '/settings/appearance',
  [APP_PAGES.SETTINGS_SECURITY]: '/settings/security',
  [APP_PAGES.SETTINGS_NOTIFICATIONS]: '/settings/notifications',
  [APP_PAGES.SETTINGS_REPORT_MANAGEMENT]: '/settings/report-management',
  [APP_PAGES.SETTINGS_AUDIT_LOGS]: '/settings/audit-logs',
  [APP_PAGES.SETTINGS_SYSTEM]: '/settings/system',
  [APP_PAGES.SETTINGS_PRIVACY_TERMS]: '/settings/privacy-policy',
  [APP_PAGES.LOGOUT]: '/logout',
}
