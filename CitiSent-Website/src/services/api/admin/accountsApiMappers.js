function formatDate(value) {
  if (!value) {
    return 'Not available'
  }

  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  })
}

const BACKEND_TO_UI_USER_STATUS = {
  active: 'Active',
  banned: 'Banned',
}

const UI_TO_BACKEND_USER_STATUS = {
  Active: 'active',
  Banned: 'banned',
}

function normalizeUserStatusLabel(status) {
  const normalizedStatus = String(status || '').trim().toLowerCase()
  return BACKEND_TO_UI_USER_STATUS[normalizedStatus] || 'Active'
}

export function mapBackendProfileToAdminProfile(payload = {}) {
  return {
    id: payload.id || '',
    fullName: payload.fullName || payload.username || '',
    username: payload.username || '',
    email: payload.email || '',
    departmentId: payload.departmentId || '',
    department: payload.departmentLabel || '',
    role: payload.role || '',
    phone: payload.phoneNumber || '',
    address: payload.address || '',
    joinedAt: payload.joinedAt || '',
    lastLoginAt: payload.lastLoginAt || '',
    accountType: payload.accountType || '',
  }
}

export function mapBackendUserToUiRow(payload = {}) {
  const joinedAtValue = Date.parse(payload.joinedAt || payload.updatedAt || '')

  return {
    id: payload.id || '',
    name: payload.fullName || payload.username || payload.email || 'Unknown User',
    email: payload.email || 'Not available',
    address: payload.address || 'Not available',
    status: normalizeUserStatusLabel(payload.status),
    registeredAt: formatDate(payload.joinedAt),
    registeredAtValue: Number.isNaN(joinedAtValue) ? 0 : joinedAtValue,
    username: payload.username || '',
    role: payload.role || '',
    accountType: payload.accountType || '',
    phoneNumber: payload.phoneNumber || '',
    departmentLabel: payload.departmentLabel || '',
    departmentId: payload.departmentId || '',
    ban: payload.ban || null,
    joinedAt: payload.joinedAt || '',
    updatedAt: payload.updatedAt || '',
  }
}

export function mapUiStatusToBackendUserStatus(status) {
  return UI_TO_BACKEND_USER_STATUS[String(status || '').trim()] || 'active'
}

export function mapBackendOfficeAdmin(payload = {}) {
  return {
    id: payload.id || '',
    fullName: payload.fullName || '',
    email: payload.email || '',
    departmentId: payload.departmentId || '',
    department: payload.departmentLabel || '',
    role: payload.role || '',
    phone: payload.phoneNumber || '',
    address: payload.address || '',
    joinedAt: payload.joinedAt || '',
    lastLoginAt: payload.lastLoginAt || '',
  }
}
