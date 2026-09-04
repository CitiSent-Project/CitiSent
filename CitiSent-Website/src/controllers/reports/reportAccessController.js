import { canAccessDepartment, isSuperadmin } from '../models/roleAccessModel'

export function filterReportsForAdmin({ rows = [], profile }) {
  const role = profile?.role
  const adminDepartmentId = profile?.departmentId

  return rows.filter((row) =>
    canAccessDepartment({
      role,
      adminDepartmentId,
      reportDepartmentId: row.categoryId,
    })
  )
}

export function canAdminUpdateReport({ profile, report }) {
  return canAccessDepartment({
    role: profile?.role,
    adminDepartmentId: profile?.departmentId,
    reportDepartmentId: report?.categoryId,
  })
}

export function getScopedAgencyFilters({ agencies = [], profile }) {
  if (isSuperadmin(profile?.role)) {
    return agencies
  }

  return agencies.filter((agency) => agency.id === profile?.departmentId)
}
