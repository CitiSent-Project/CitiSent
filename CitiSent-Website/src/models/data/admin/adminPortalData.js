export const ADMIN_STORAGE_KEYS = {
  profile: 'citisent.admin.profile',
  accessToken: 'citisent.admin.accessToken',
  adminAccounts: 'citisent.admin.adminAccounts',
  preferences: 'citisent.admin.preferences',
  notifications: 'citisent.admin.notifications',
  notificationsByAdmin: 'citisent.admin.notificationsByAdmin',
  activity: 'citisent.admin.activity',
  transferRequests: 'citisent.admin.transferRequests',
  rememberEmail: 'citisent.admin.rememberEmail',
  authSession: 'citisent.admin.authSession',
  activePage: 'citisent.admin.activePage',
  settingsActiveTab: 'citisent.admin.settingsActiveTab',
}

export const DEFAULT_ADMIN_PROFILE = {
  id: '',
  fname: '',
  mname: '',
  lname: '',
  fullName: '',
  email: '',
  departmentId: '',
  department: '',
  role: '',
  phone: '',
  barangay: '',
  city: '',
  province: '',
  accountType: '',
  joinedAt: '',
  lastLoginAt: '',
}

export const DEFAULT_ADMIN_ACCOUNTS = []

export const DEFAULT_PREFERENCES = {
  displayName: 'City Operations Admin',
  department: 'City Operations Office',
  notificationsEnabled: true,
  digestFrequency: 'Weekly',
  reportStatusUpdates: true,
  adminInvitations: true,
  newReports: true,
  escalatedReports: true,
  summaryEmails: false,
  theme: 'System',
  fontSize: 'Medium',
  animationsEnabled: true,
  sessionTimeout: 30,
  reportsPerPage: 6,
  defaultSorting: 'Latest first',
  anonymousReports: true,
  autoCloseReports: false,
  auditTrackingEnabled: true,
  timezone: 'Asia/Manila',
}

export const DEFAULT_TRANSFER_REQUESTS = []

export function formatDateTime(value) {
  if (!value) {
    return 'Not available'
  }

  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function createActivityEntry(action, detail) {
  return {
    id: `activity-${Date.now()}`,
    action,
    detail,
    createdAt: new Date().toISOString(),
  }
}
