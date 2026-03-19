import { describe, expect, it } from 'vitest'
import { buildOfficeAdminDepartmentAssignment, getOfficeAdmins } from '../adminManagementController'
import { USER_ROLES } from '../../models/roleAccessModel'

describe('adminManagementController', () => {
  const adminAccounts = [
    { id: 'super-1', role: USER_ROLES.SUPERADMIN, fullName: 'Super Admin' },
    {
      id: 'office-1',
      role: USER_ROLES.OFFICE_ADMIN,
      fullName: 'Office Admin One',
      departmentId: 'bplo',
      department: 'Business Permits and Licensing Office (BPLO)',
    },
  ]

  it('returns office admins only', () => {
    expect(getOfficeAdmins(adminAccounts)).toEqual([adminAccounts[1]])
  })

  it('builds assignment transition when department changes', () => {
    const transition = buildOfficeAdminDepartmentAssignment({
      adminAccounts,
      adminId: 'office-1',
      nextDepartmentId: 'cto',
      nextDepartmentLabel: 'City Treasury Office',
    })

    expect(transition.nextAdminAccounts[1].departmentId).toBe('cto')
    expect(transition.activity.action).toBe('Office admin reassigned')
  })

  it('returns null when no assignment change is needed', () => {
    const transition = buildOfficeAdminDepartmentAssignment({
      adminAccounts,
      adminId: 'office-1',
      nextDepartmentId: 'bplo',
      nextDepartmentLabel: 'Business Permits and Licensing Office (BPLO)',
    })

    expect(transition).toBeNull()
  })
})
