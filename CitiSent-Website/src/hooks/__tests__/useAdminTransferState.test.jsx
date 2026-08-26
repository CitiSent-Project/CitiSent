/* @vitest-environment jsdom */
/**
 * useAdminTransferState.test.js
 *
 * Focused tests for the extracted transfer-request and office-admin
 * assignment hook. These validate authorization checks, duplicate
 * request rejection, notification synchronization, and audit activity
 * for all four public actions.
 */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAdminTransferState } from '../useAdminTransferState'

// ---------------------------------------------------------------------------
// Mock all API service modules used by the hook.
// ---------------------------------------------------------------------------
vi.mock('../../services/api/admin/transferRequestsApiService', () => ({
  transferRequestsApiService: {
    createTransferRequest: vi.fn(),
    approveTransferRequest: vi.fn(),
    rejectTransferRequest: vi.fn(),
  },
}))

vi.mock('../../services/api/admin/officeAdminsApiService', () => ({
  officeAdminsApiService: {
    assignOfficeDepartment: vi.fn(),
  },
}))

vi.mock('../../services/api/admin/accountsApiMappers', () => ({
  mapBackendOfficeAdmin: vi.fn((data) => ({
    id: data?.id || '',
    fullName: data?.fullName || '',
    department: data?.departmentLabel || '',
    departmentId: data?.departmentId || '',
    role: data?.role || 'Office Admin',
  })),
}))

vi.mock('../../services/api/admin/transferRequestsApiMappers', () => ({
  mapBackendTransferRequest: vi.fn((data) => ({
    id: data?.id || '',
    adminId: data?.adminId || '',
    adminName: data?.adminName || '',
    currentDepartmentId: data?.currentDepartmentId || '',
    currentDepartmentLabel: data?.currentDepartmentLabel || '',
    requestedDepartmentId: data?.requestedDepartmentId || '',
    requestedDepartmentLabel: data?.requestedDepartmentLabel || '',
    reason: data?.reason || '',
    status: {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
    }[data?.status] || data?.status || 'Pending',
    reviewedAt: data?.reviewedAt || '',
    reviewedById: data?.reviewerId || '',
    reviewedByName: data?.reviewerName || '',
    reviewNotes: data?.reviewNotes || '',
  })),
}))

import { transferRequestsApiService } from '../../services/api/admin/transferRequestsApiService'
import { officeAdminsApiService } from '../../services/api/admin/officeAdminsApiService'

// ---------------------------------------------------------------------------
// Shared fixture data
// ---------------------------------------------------------------------------
const SUPERADMIN_PROFILE = {
  id: 'admin-super-001',
  fullName: 'City Superadmin',
  role: 'Superadmin',
  departmentId: 'all',
  department: 'All Departments',
}

const OFFICE_ADMIN_PROFILE = {
  id: 'admin-office-001',
  fullName: 'BPLO Office Admin',
  role: 'Office Admin',
  departmentId: 'bplo',
  department: 'Business Permits and Licensing Office (BPLO)',
}

const PENDING_TRANSFER = {
  id: 'transfer-req-001',
  adminId: 'admin-office-001',
  adminName: 'BPLO Office Admin',
  currentDepartmentId: 'bplo',
  currentDepartmentLabel: 'Business Permits and Licensing Office (BPLO)',
  requestedDepartmentId: 'cto',
  requestedDepartmentLabel: 'City Treasury Office',
  reason: 'Operational reassignment',
  status: 'Pending',
}

// ---------------------------------------------------------------------------
// Test harness: renders the hook so we can call its actions.
// ---------------------------------------------------------------------------
function createHarness(overrides = {}) {
  const setAdminAccounts = vi.fn()
  const setTransferRequests = vi.fn()
  const setProfile = vi.fn()
  const setPreferences = vi.fn()
  const setNotificationsByAdmin = vi.fn()
  const addActivity = vi.fn()
  const notifySuccess = vi.fn()
  const notifyError = vi.fn()

  const deps = {
    accessToken: 'token-abc',
    profile: SUPERADMIN_PROFILE,
    transferRequests: [PENDING_TRANSFER],
    superadminRecipientIds: [],
    setAdminAccounts,
    setTransferRequests,
    setProfile,
    setPreferences,
    setNotificationsByAdmin,
    addActivity,
    notifySuccess,
    notifyError,
    ...overrides,
  }

  let latest = null

  function HookHarness() {
    latest = useAdminTransferState(deps)
    return null
  }

  return {
    HookHarness,
    getLatest: () => latest,
    deps,
    spies: {
      setAdminAccounts,
      setTransferRequests,
      setProfile,
      setPreferences,
      setNotificationsByAdmin,
      addActivity,
      notifySuccess,
      notifyError,
    },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('useAdminTransferState', () => {
  let container
  let root

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    act(() => {
      root?.unmount()
    })
    container?.remove()
    globalThis.IS_REACT_ACT_ENVIRONMENT = false
    vi.clearAllMocks()
  })

  function mount(harness) {
    root = createRoot(container)
    act(() => {
      root.render(<harness.HookHarness />)
    })
  }

  // -------------------------------------------------------------------------
  // handleSubmitTransferRequest
  // -------------------------------------------------------------------------
  describe('handleSubmitTransferRequest', () => {
    it('rejects submission when session has expired', async () => {
      const harness = createHarness({ accessToken: '', profile: OFFICE_ADMIN_PROFILE })
      mount(harness)

      let result
      await act(async () => {
        result = await harness.getLatest().handleSubmitTransferRequest({
          requestedDepartmentId: 'cto',
          requestedDepartmentLabel: 'City Treasury Office',
          reason: 'Need a change',
        })
      })

      expect(result.ok).toBe(false)
      expect(harness.spies.notifyError).toHaveBeenCalledWith(
        'Transfer request blocked.',
        'Your session has expired. Please sign in again.'
      )
    })

    it('rejects submission when admin already has a pending request', async () => {
      const harness = createHarness({
        profile: OFFICE_ADMIN_PROFILE,
        transferRequests: [{ ...PENDING_TRANSFER, adminId: OFFICE_ADMIN_PROFILE.id }],
      })
      mount(harness)

      let result
      await act(async () => {
        result = await harness.getLatest().handleSubmitTransferRequest({
          requestedDepartmentId: 'another-dept',
          requestedDepartmentLabel: 'Another Department',
          reason: 'Test',
        })
      })

      expect(result.ok).toBe(false)
      expect(harness.spies.notifyError).toHaveBeenCalledWith(
        'Transfer request blocked.',
        'You already have a pending transfer request.'
      )
    })

    it('creates request and notifies requester and superadmin recipients on success', async () => {
      transferRequestsApiService.createTransferRequest.mockResolvedValue({
        data: {
          id: 'transfer-new',
          adminId: OFFICE_ADMIN_PROFILE.id,
          adminName: OFFICE_ADMIN_PROFILE.fullName,
          requestedDepartmentId: 'cto',
          requestedDepartmentLabel: 'City Treasury Office',
          status: 'pending',
          reason: 'Want to help',
        },
      })

      const harness = createHarness({
        profile: OFFICE_ADMIN_PROFILE,
        transferRequests: [], // no pending requests
        superadminRecipientIds: ['admin-super-001'],
      })
      mount(harness)

      let result
      await act(async () => {
        result = await harness.getLatest().handleSubmitTransferRequest({
          requestedDepartmentId: 'cto',
          requestedDepartmentLabel: 'City Treasury Office',
          reason: 'Want to help',
        })
      })

      expect(result.ok).toBe(true)
      expect(harness.spies.setTransferRequests).toHaveBeenCalled()
      expect(harness.spies.setNotificationsByAdmin).toHaveBeenCalled()
      expect(harness.spies.addActivity).toHaveBeenCalledWith(
        'Department transfer requested',
        expect.stringContaining('City Treasury Office')
      )
      expect(harness.spies.notifySuccess).toHaveBeenCalledWith('Transfer request submitted successfully.')
    })
  })

  // -------------------------------------------------------------------------
  // handleAssignOfficeDepartment
  // -------------------------------------------------------------------------
  describe('handleAssignOfficeDepartment', () => {
    it('rejects assignment from non-superadmin', async () => {
      const harness = createHarness({ profile: OFFICE_ADMIN_PROFILE })
      mount(harness)

      let result
      await act(async () => {
        result = await harness.getLatest().handleAssignOfficeDepartment({
          adminId: 'admin-office-002',
          departmentId: 'cto',
          departmentLabel: 'City Treasury Office',
        })
      })

      expect(result.ok).toBe(false)
      expect(harness.spies.notifyError).toHaveBeenCalledWith(
        'Assignment denied.',
        'Only superadmins can update office-admin assignments.'
      )
    })

    it('rejects assignment when session is expired', async () => {
      const harness = createHarness({ accessToken: '' })
      mount(harness)

      let result
      await act(async () => {
        result = await harness.getLatest().handleAssignOfficeDepartment({
          adminId: 'admin-office-002',
          departmentId: 'cto',
          departmentLabel: 'City Treasury Office',
        })
      })

      expect(result.ok).toBe(false)
      expect(harness.spies.notifyError).toHaveBeenCalledWith(
        'Assignment denied.',
        'Your session has expired. Please sign in again.'
      )
    })
  })

  // -------------------------------------------------------------------------
  // handleApproveTransfer
  // -------------------------------------------------------------------------
  describe('handleApproveTransfer', () => {
    it('rejects approval from non-superadmin', async () => {
      const harness = createHarness({ profile: OFFICE_ADMIN_PROFILE })
      mount(harness)

      let result
      await act(async () => {
        result = await harness.getLatest().handleApproveTransfer({
          requestId: 'transfer-req-001',
          reviewNotes: 'Looks good',
        })
      })

      expect(result.ok).toBe(false)
      expect(harness.spies.notifyError).toHaveBeenCalledWith(
        'Approval denied.',
        'Only superadmins can approve transfer requests.'
      )
    })

    it('rejects approval when session is expired', async () => {
      const harness = createHarness({ accessToken: '' })
      mount(harness)

      let result
      await act(async () => {
        result = await harness.getLatest().handleApproveTransfer({
          requestId: 'transfer-req-001',
          reviewNotes: 'Approved',
        })
      })

      expect(result.ok).toBe(false)
      expect(harness.spies.notifyError).toHaveBeenCalledWith(
        'Approval denied.',
        'Your session has expired. Please sign in again.'
      )
    })

    it('synchronizes requests, accounts, notifications, and activity on approval', async () => {
      transferRequestsApiService.approveTransferRequest.mockResolvedValue({
        data: {
          id: 'transfer-req-001',
          adminId: 'admin-office-001',
          adminName: 'BPLO Office Admin',
          currentDepartmentId: 'bplo',
          currentDepartmentLabel: 'Business Permits and Licensing Office (BPLO)',
          requestedDepartmentId: 'cto',
          requestedDepartmentLabel: 'City Treasury Office',
          status: 'approved',
          reviewedAt: '2026-03-11T08:30:00.000Z',
          reviewerId: 'admin-super-001',
          reviewerName: 'City Superadmin',
          reviewNotes: 'Approved by superadmin',
        },
      })

      const harness = createHarness()
      mount(harness)

      let result
      await act(async () => {
        result = await harness.getLatest().handleApproveTransfer({
          requestId: 'transfer-req-001',
          reviewNotes: 'Approved by superadmin',
        })
      })

      expect(result.ok).toBe(true)
      // Transfer request should be updated
      expect(harness.spies.setTransferRequests).toHaveBeenCalled()
      // Admin accounts should be updated with new department
      expect(harness.spies.setAdminAccounts).toHaveBeenCalled()
      // Both parties should receive notifications
      expect(harness.spies.setNotificationsByAdmin).toHaveBeenCalled()
      // Activity should be logged
      expect(harness.spies.addActivity).toHaveBeenCalledWith(
        'Department transfer approved',
        expect.stringContaining('BPLO Office Admin')
      )
      expect(harness.spies.notifySuccess).toHaveBeenCalledWith('Transfer request approved.')
    })
  })

  // -------------------------------------------------------------------------
  // handleRejectTransfer
  // -------------------------------------------------------------------------
  describe('handleRejectTransfer', () => {
    it('rejects rejection from non-superadmin', async () => {
      const harness = createHarness({ profile: OFFICE_ADMIN_PROFILE })
      mount(harness)

      let result
      await act(async () => {
        result = await harness.getLatest().handleRejectTransfer({
          requestId: 'transfer-req-001',
          reviewNotes: 'Not needed',
        })
      })

      expect(result.ok).toBe(false)
      expect(harness.spies.notifyError).toHaveBeenCalledWith(
        'Rejection denied.',
        'Only superadmins can reject transfer requests.'
      )
    })

    it('rejects rejection when session is expired', async () => {
      const harness = createHarness({ accessToken: '' })
      mount(harness)

      let result
      await act(async () => {
        result = await harness.getLatest().handleRejectTransfer({
          requestId: 'transfer-req-001',
          reviewNotes: 'Denied',
        })
      })

      expect(result.ok).toBe(false)
      expect(harness.spies.notifyError).toHaveBeenCalledWith(
        'Rejection denied.',
        'Your session has expired. Please sign in again.'
      )
    })

    it('synchronizes requests, notifications, and activity on rejection', async () => {
      transferRequestsApiService.rejectTransferRequest.mockResolvedValue({
        data: {
          id: 'transfer-req-001',
          adminId: 'admin-office-001',
          adminName: 'BPLO Office Admin',
          currentDepartmentId: 'bplo',
          currentDepartmentLabel: 'Business Permits and Licensing Office (BPLO)',
          requestedDepartmentId: 'cto',
          requestedDepartmentLabel: 'City Treasury Office',
          status: 'rejected',
          reviewedAt: '2026-03-11T08:30:00.000Z',
          reviewerId: 'admin-super-001',
          reviewerName: 'City Superadmin',
          reviewNotes: 'Insufficient business need',
        },
      })

      const harness = createHarness()
      mount(harness)

      let result
      await act(async () => {
        result = await harness.getLatest().handleRejectTransfer({
          requestId: 'transfer-req-001',
          reviewNotes: 'Insufficient business need',
        })
      })

      expect(result.ok).toBe(true)
      // Transfer request should be updated
      expect(harness.spies.setTransferRequests).toHaveBeenCalled()
      // Department assignment should NOT change (rejection does not reassign)
      expect(harness.spies.setAdminAccounts).not.toHaveBeenCalled()
      // Both parties should receive notifications
      expect(harness.spies.setNotificationsByAdmin).toHaveBeenCalled()
      // Activity should be logged
      expect(harness.spies.addActivity).toHaveBeenCalledWith(
        'Department transfer rejected',
        expect.stringContaining('BPLO Office Admin')
      )
      expect(harness.spies.notifySuccess).toHaveBeenCalledWith('Transfer request rejected.')
    })

    it('rejects rejection when the request is no longer pending', async () => {
      const harness = createHarness({
        transferRequests: [{ ...PENDING_TRANSFER, status: 'Approved' }],
      })
      mount(harness)

      let result
      await act(async () => {
        result = await harness.getLatest().handleRejectTransfer({
          requestId: 'transfer-req-001',
          reviewNotes: 'Denied',
        })
      })

      expect(result.ok).toBe(false)
      expect(harness.spies.notifyError).toHaveBeenCalledWith(
        'Rejection failed.',
        'The selected request is no longer pending.'
      )
    })
  })
})
