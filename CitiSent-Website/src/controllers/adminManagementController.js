import { USER_ROLES } from '../models/roleAccessModel'

export function getOfficeAdmins(adminAccounts = []) {
  return adminAccounts.filter((admin) => admin.role === USER_ROLES.OFFICE_ADMIN)
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
