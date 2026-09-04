import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildTransferApproval,
  buildTransferRejection,
  buildTransferRequestCreation,
  getPendingTransferRequests,
  TRANSFER_REQUEST_STATUS,
} from '../admin/departmentTransferController'

describe('departmentTransferController', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('builds transfer request payload', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-18T10:00:00.000Z'))

    const result = buildTransferRequestCreation({
      profile: {
        id: 'admin-1',
        fullName: 'BPLO Admin',
        departmentId: 'bplo',
        department: 'Business Permits and Licensing Office (BPLO)',
      },
      requestedDepartmentId: 'cto',
      requestedDepartmentLabel: 'City Treasury Office',
      reason: 'Office realignment',
    })

    expect(result.request.adminId).toBe('admin-1')
    expect(result.request.status).toBe(TRANSFER_REQUEST_STATUS.PENDING)
    expect(result.request.requestedDepartmentId).toBe('cto')
    expect(result.activity.action).toBe('Department transfer requested')
  })

  it('builds approval and rejection transitions', () => {
    const request = {
      id: 'transfer-1',
      adminName: 'BPLO Admin',
      requestedDepartmentLabel: 'City Treasury Office',
    }
    const reviewerProfile = { id: 'super-1', fullName: 'City Superadmin' }

    const approval = buildTransferApproval({ request, reviewerProfile, reviewNotes: 'Approved.' })
    expect(approval.updatedRequest.status).toBe(TRANSFER_REQUEST_STATUS.APPROVED)
    expect(approval.notification.title).toBe('Transfer approved')

    const rejection = buildTransferRejection({
      request,
      reviewerProfile,
      reviewNotes: 'Not enough staffing.',
    })
    expect(rejection.updatedRequest.status).toBe(TRANSFER_REQUEST_STATUS.REJECTED)
    expect(rejection.notification.title).toBe('Transfer rejected')
  })

  it('filters pending transfer requests', () => {
    const requests = [
      { id: '1', status: TRANSFER_REQUEST_STATUS.PENDING },
      { id: '2', status: TRANSFER_REQUEST_STATUS.APPROVED },
    ]

    expect(getPendingTransferRequests(requests)).toEqual([
      { id: '1', status: TRANSFER_REQUEST_STATUS.PENDING },
    ])
  })
})
