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
  LOGOUT: 'Logout',
}

export const AUTH_PAGES = {
  LOGIN: 'Login',
  REGISTER: 'Register',
}

export const REPORT_SECTIONS = {
  CATEGORY: 'category',
  URGENCY: 'urgency',
  HISTORY: 'history',
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
  [APP_PAGES.LOGOUT]: '/logout',
}
