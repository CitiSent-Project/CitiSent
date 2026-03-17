export const ADMIN_STORAGE_KEYS = {
  profile: 'citisent.admin.profile',
  preferences: 'citisent.admin.preferences',
  notifications: 'citisent.admin.notifications',
  activity: 'citisent.admin.activity',
  rememberEmail: 'citisent.admin.rememberEmail',
  authSession: 'citisent.admin.authSession',
  activePage: 'citisent.admin.activePage',
  settingsActiveTab: 'citisent.admin.settingsActiveTab',
}

export const DEFAULT_ADMIN_PROFILE = {
  fullName: 'City Operations Admin',
  email: 'admin@citisent.gov',
  department: 'City Operations Office',
  role: 'Administrator',
  phone: '+63 900 000 0000',
  address: 'City Hall Building, Main District',
  password: 'admin123',
  joinedAt: '2026-03-01T08:30:00.000Z',
  lastLoginAt: '',
}

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
