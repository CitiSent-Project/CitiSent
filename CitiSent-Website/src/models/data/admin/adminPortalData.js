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

export const DEPARTMENT_OPTIONS = [
  { id: 'bplo', label: 'Business Permits and Licensing Office (BPLO)' },
  { id: 'cto', label: 'City Treasury Office' },
  { id: 'bfp', label: 'Bureau of Fire Protection (BFP) Processing Area' },
  { id: 'ctmd', label: 'City Traffic Management Division/Impounding Services' },
  { id: 'cvo', label: 'City Veterinary Office' },
  { id: 'cao', label: 'City Agriculture Office' },
  { id: 'ccdo', label: 'City Cooperative Development Office' },
  { id: 'peso', label: 'Public Employment Service Office (PESO)' },
  { id: 'pwd', label: 'Senior Citizens / PWD Accessibility Services' },
]

export function getDepartmentLabelById(departmentId) {
  return DEPARTMENT_OPTIONS.find((department) => department.id === departmentId)?.label || ''
}

export const DEFAULT_ADMIN_PROFILE = {
  id: '',
  fullName: '',
  email: '',
  departmentId: '',
  department: '',
  role: '',
  phone: '',
  address: '',
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
  theme: 'System',
  fontSize: 'Medium',
  animationsEnabled: true,
  sessionTimeout: 30,
}

export const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'New Report Submitted',
    message: 'A road damage report in Barangay 12 needs review.',
    type: 'Report',
    createdAt: '2026-03-12T08:00:00.000Z',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Weekly Summary Ready',
    message: 'Your weekly city incidents summary is now available.',
    type: 'Summary',
    createdAt: '2026-03-11T15:30:00.000Z',
    read: true,
  },
  {
    id: 'notif-3',
    title: 'New Admin Invitation',
    message: 'A new admin user requested access confirmation.',
    type: 'Account',
    createdAt: '2026-03-10T11:20:00.000Z',
    read: false,
  },
]

export const DEFAULT_TRANSFER_REQUESTS = []

export function buildDefaultNotificationsByAdmin(adminAccounts = DEFAULT_ADMIN_ACCOUNTS) {
  return adminAccounts.reduce((accumulator, admin) => {
    accumulator[admin.id] = DEFAULT_NOTIFICATIONS.map((notification) => ({
      ...notification,
      id: `${notification.id}-${admin.id}`,
    }))
    return accumulator
  }, {})
}

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
