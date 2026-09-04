import { describe, expect, it } from 'vitest'
import {
  buildOfficeAdminDepartmentAssignment,
  buildUnreadByAdminId,
  filterOfficeAdmins,
  filterPendingTransferRequests,
  getOfficeAdmins,
  getTotalUnreadCount,
} from '../admin/adminManagementController'
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

  it('builds unread count map per office admin', () => {
    const officeAdmins = getOfficeAdmins(adminAccounts)
    const unreadByAdminId = buildUnreadByAdminId({
      officeAdmins,
      notificationsByAdmin: {
        'office-1': [
          { id: 'n-1', read: false },
          { id: 'n-2', read: true },
          { id: 'n-3', read: false },
        ],
      },
    })

    expect(unreadByAdminId).toEqual({ 'office-1': 2 })
    expect(getTotalUnreadCount(unreadByAdminId)).toBe(2)
  })

  it('filters office admins by search, department, and unread only', () => {
    const officeAdmins = [
      {
        id: 'office-1',
        fullName: 'Office Admin One',
        email: 'one@city.gov',
        department: 'Business Permits and Licensing Office (BPLO)',
        departmentId: 'bplo',
      },
      {
        id: 'office-2',
        fullName: 'Office Admin Two',
        email: 'two@city.gov',
        department: 'City Treasury Office',
        departmentId: 'cto',
      },
    ]

    const result = filterOfficeAdmins({
      officeAdmins,
      searchTerm: 'two',
      departmentFilter: 'cto',
      unreadFilter: 'unread-only',
      unreadByAdminId: {
        'office-1': 1,
        'office-2': 3,
      },
    })

    expect(result).toEqual([officeAdmins[1]])
  })

  it('filters pending transfer requests by search and department', () => {
    const pendingRequests = [
      {
        id: 'tr-1',
        adminName: 'Office Admin One',
        currentDepartmentId: 'bplo',
        currentDepartmentLabel: 'Business Permits and Licensing Office (BPLO)',
        requestedDepartmentId: 'cto',
        requestedDepartmentLabel: 'City Treasury Office',
        reason: 'Workload balancing',
      },
      {
        id: 'tr-2',
        adminName: 'Office Admin Two',
        currentDepartmentId: 'cto',
        currentDepartmentLabel: 'City Treasury Office',
        requestedDepartmentId: 'bplo',
        requestedDepartmentLabel: 'Business Permits and Licensing Office (BPLO)',
        reason: 'Special project',
      },
    ]

    const result = filterPendingTransferRequests({
      pendingRequests,
      searchTerm: 'project',
      departmentFilter: 'cto',
    })

    expect(result).toEqual([pendingRequests[1]])
  })
})
