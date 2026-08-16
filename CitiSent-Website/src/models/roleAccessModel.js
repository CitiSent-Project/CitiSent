import { APP_PAGES } from './pageModel'

export const USER_ROLES = {
  SUPERADMIN: 'Superadmin',
  OFFICE_ADMIN: 'Office Admin',
}

export function normalizeUserRole(role) {
  if (role === USER_ROLES.SUPERADMIN || role === USER_ROLES.OFFICE_ADMIN) {
    return role
  }

  const normalizedRole = String(role || '').trim().toLowerCase()
  if (
    normalizedRole === 'administrator' ||
    normalizedRole === 'admin' ||
    normalizedRole === 'super admin' ||
    normalizedRole === 'superadmin'
  ) {
    return USER_ROLES.SUPERADMIN
  }

  if (normalizedRole === 'office-admin' || normalizedRole === 'office admin') {
    return USER_ROLES.OFFICE_ADMIN
  }

  return ''
}

export const ROLE_PAGE_ACCESS = {
  [USER_ROLES.SUPERADMIN]: [
    APP_PAGES.DASHBOARD,
    APP_PAGES.ADMIN_MANAGEMENT,
    APP_PAGES.USERS,
    APP_PAGES.REPORTS,
    APP_PAGES.REPORTS_BY_CATEGORY,
    APP_PAGES.REPORTS_BY_URGENCY,
    APP_PAGES.REPORTS_HISTORY,
    APP_PAGES.REPORT_DETAIL,
    APP_PAGES.CONVERSATIONS,
    APP_PAGES.ADMIN_PROFILE,
    APP_PAGES.NOTIFICATIONS,
    APP_PAGES.SETTINGS,
    APP_PAGES.LOGOUT,
  ],
  [USER_ROLES.OFFICE_ADMIN]: [
    APP_PAGES.DASHBOARD,
    APP_PAGES.USERS,
    APP_PAGES.REPORTS,
    APP_PAGES.REPORTS_BY_CATEGORY,
    APP_PAGES.REPORTS_BY_URGENCY,
    APP_PAGES.REPORTS_HISTORY,
    APP_PAGES.REPORT_DETAIL,
    APP_PAGES.CONVERSATIONS,
    APP_PAGES.ADMIN_PROFILE,
    APP_PAGES.NOTIFICATIONS,
    APP_PAGES.SETTINGS,
    APP_PAGES.LOGOUT,
  ],
}

export function isSuperadmin(role) {
  return normalizeUserRole(role) === USER_ROLES.SUPERADMIN
}

export function canAccessPage({ role, page }) {
  const allowedPages = ROLE_PAGE_ACCESS[normalizeUserRole(role)] || []
  return allowedPages.includes(page)
}

export function canAccessDepartment({ role, adminDepartmentId, reportDepartmentId }) {
  if (isSuperadmin(role)) {
    return true
  }

  return String(adminDepartmentId || '') === String(reportDepartmentId || '')
}

export function canReviewTransferRequest(role) {
  return isSuperadmin(role)
}
