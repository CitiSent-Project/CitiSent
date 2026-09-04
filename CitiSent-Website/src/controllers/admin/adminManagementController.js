import { USER_ROLES } from '../../models/roleAccessModel'

export function getOfficeAdmins(adminAccounts = []) {
  return adminAccounts.filter((admin) => admin.role === USER_ROLES.OFFICE_ADMIN)
}

function includesQuery(value, query) {
  return String(value || '').toLowerCase().includes(query)
}

export function buildUnreadByAdminId({ officeAdmins = [], notificationsByAdmin = {} }) {
  return officeAdmins.reduce((accumulator, admin) => {
    accumulator[admin.id] = (notificationsByAdmin[admin.id] || []).filter(
      (notification) => !notification.read
    ).length
    return accumulator
  }, {})
}

export function getTotalUnreadCount(unreadByAdminId = {}) {
  return Object.values(unreadByAdminId).reduce((sum, value) => sum + value, 0)
}

export function filterOfficeAdmins({
  officeAdmins = [],
  searchTerm = '',
  departmentFilter = 'all',
  unreadFilter = 'all',
  unreadByAdminId = {},
}) {
  const query = String(searchTerm).trim().toLowerCase()

  return officeAdmins.filter((admin) => {
    const matchesSearch =
      query.length === 0
        ? true
        : [admin.fullName, admin.email, admin.department].some((value) => includesQuery(value, query))

    const matchesDepartment =
      departmentFilter === 'all' ? true : admin.departmentId === departmentFilter

    const unreadCount = unreadByAdminId[admin.id] || 0
    const matchesUnread = unreadFilter === 'unread-only' ? unreadCount > 0 : true

    return matchesSearch && matchesDepartment && matchesUnread
  })
}

export function filterPendingTransferRequests({
  pendingRequests = [],
  searchTerm = '',
  departmentFilter = 'all',
}) {
  const query = String(searchTerm).trim().toLowerCase()

  return pendingRequests.filter((request) => {
    const matchesSearch =
      query.length === 0
        ? true
        : [
            request.adminName,
            request.currentDepartmentLabel,
            request.requestedDepartmentLabel,
            request.reason,
          ].some((value) => includesQuery(value, query))

    const matchesDepartment =
      departmentFilter === 'all'
        ? true
        : request.currentDepartmentId === departmentFilter ||
          request.requestedDepartmentId === departmentFilter

    return matchesSearch && matchesDepartment
  })
}

export function buildOfficeAdminDepartmentAssignment({
  adminAccounts,
  adminId,
  nextDepartmentId,
  nextDepartmentLabel,
}) {
  const officeAdmin = adminAccounts.find((admin) => admin.id === adminId)
  if (!officeAdmin || officeAdmin.role !== USER_ROLES.OFFICE_ADMIN) {
    return null
  }

  if (officeAdmin.departmentId === nextDepartmentId) {
    return null
  }

  return {
    nextAdminAccounts: adminAccounts.map((admin) =>
      admin.id === adminId
        ? {
            ...admin,
            departmentId: nextDepartmentId,
            department: nextDepartmentLabel,
          }
        : admin
    ),
    activity: {
      action: 'Office admin reassigned',
      detail: `${officeAdmin.fullName} moved to ${nextDepartmentLabel}`,
    },
  }
}
