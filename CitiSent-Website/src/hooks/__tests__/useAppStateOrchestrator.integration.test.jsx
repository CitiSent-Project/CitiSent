/* @vitest-environment jsdom */
import { act, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStateOrchestrator } from '../useAppStateOrchestrator'
import { ADMIN_STORAGE_KEYS } from '../../models/data'
import { APP_PAGES } from '../../models/pageModel'
import { authApiService } from '../../services/authApiService'
import { adminApiService } from '../../services/adminApiService'

vi.mock('../../components/ui/toastHelpers', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}))

vi.mock('../usePageLoadingState', () => ({
  usePageLoadingState: vi.fn(),
}))

vi.mock('../useAuthSession', () => ({
  useAuthSession: vi.fn(() => ({
    handleRegister: vi.fn(),
    handleLogin: vi.fn(),
    handleLogout: vi.fn(),
  })),
}))

vi.mock('../../services/authApiService', () => ({
  authApiService: {
    me: vi.fn(),
    login: vi.fn(),
    updateCurrentUser: vi.fn(),
  },
}))

vi.mock('../../services/adminApiService', () => ({
  adminApiService: {
    getActivityLog: vi.fn(),
    createActivityLogEntry: vi.fn(),
    getDepartments: vi.fn(),
    listNotifications: vi.fn(),
    updateNotificationReadState: vi.fn(),
    clearNotifications: vi.fn(),
    listTransferRequests: vi.fn(),
    listOfficeAdmins: vi.fn(),
    approveTransferRequest: vi.fn(),
    rejectTransferRequest: vi.fn(),
    assignOfficeDepartment: vi.fn(),
    updateReport: vi.fn(),
    createTransferRequest: vi.fn(),
  },
}))

function schemaValue(payload, schemaVersion = 1) {
  return JSON.stringify({ schemaVersion, payload })
}

let latestState

async function flushMicrotasks(iterations = 5) {
  for (let index = 0; index < iterations; index += 1) {
    await Promise.resolve()
  }
}

function HookHarness() {
  const orchestrator = useAppStateOrchestrator()

  useEffect(() => {
    latestState = orchestrator
  }, [orchestrator])

  return null
}

describe('useAppStateOrchestrator transfer review integration', () => {
  let container
  let root

  beforeEach(async () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    window.localStorage.clear()
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const profile = {
      id: 'admin-super-001',
      fullName: 'City Superadmin',
      email: 'superadmin@citisent.gov',
      departmentId: 'all',
      department: 'All Departments',
      role: 'Superadmin',
      phone: '+63 900 000 0000',
      address: 'City Hall',
      password: 'superadmin123',
      joinedAt: '2026-03-01T08:30:00.000Z',
      lastLoginAt: '',
    }

    const accounts = [
      profile,
      {
        id: 'admin-office-001',
        fullName: 'BPLO Office Admin',
        email: 'bplo.admin@citisent.gov',
        departmentId: 'bplo',
        department: 'Business Permits and Licensing Office (BPLO)',
        role: 'OfficeAdmin',
        phone: '+63 900 111 0001',
        address: 'City Hall Annex',
        password: 'officeadmin123',
        joinedAt: '2026-03-02T09:15:00.000Z',
        lastLoginAt: '',
      },
    ]

    const notificationsByAdmin = {
      'admin-super-001': [],
      'admin-office-001': [],
    }

    const transferRequest = {
      id: 'transfer-req-001',
      adminId: 'admin-office-001',
      adminName: 'BPLO Office Admin',
      currentDepartmentId: 'bplo',
      currentDepartmentLabel: 'Business Permits and Licensing Office (BPLO)',
      requestedDepartmentId: 'cto',
      requestedDepartmentLabel: 'City Treasury Office',
      reason: 'Operational reassignment',
      status: 'Pending',
      createdAt: '2026-03-10T08:30:00.000Z',
      reviewedAt: '',
      reviewedById: '',
      reviewedByName: '',
      reviewNotes: '',
    }

    window.localStorage.setItem(ADMIN_STORAGE_KEYS.profile, schemaValue(profile))
    window.localStorage.setItem(ADMIN_STORAGE_KEYS.adminAccounts, schemaValue(accounts))
    window.localStorage.setItem(ADMIN_STORAGE_KEYS.notificationsByAdmin, schemaValue(notificationsByAdmin))
    window.localStorage.setItem(ADMIN_STORAGE_KEYS.transferRequests, schemaValue([transferRequest]))
    window.localStorage.setItem(ADMIN_STORAGE_KEYS.accessToken, schemaValue('token-abc'))
    window.localStorage.setItem(ADMIN_STORAGE_KEYS.authSession, schemaValue(true))
    window.localStorage.setItem(ADMIN_STORAGE_KEYS.activePage, schemaValue(APP_PAGES.DASHBOARD))

    authApiService.me.mockResolvedValue({
      data: {
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        role: 'Superadmin',
        accountType: 'admin',
        departmentId: profile.departmentId,
        departmentLabel: profile.department,
      },
    })
    authApiService.login.mockResolvedValue({
      data: {
        token: 'token-reauth',
        user: {
          id: profile.id,
          fullName: profile.fullName,
          email: profile.email,
          role: 'Superadmin',
          accountType: 'admin',
          departmentId: profile.departmentId,
          departmentLabel: profile.department,
        },
      },
    })
    adminApiService.listOfficeAdmins.mockResolvedValue({
      data: [
        {
          id: 'admin-office-001',
          fullName: 'BPLO Office Admin',
          email: 'bplo.admin@citisent.gov',
          departmentId: 'bplo',
          departmentLabel: 'Business Permits and Licensing Office (BPLO)',
          role: 'Office Admin',
        },
      ],
    })
    adminApiService.getDepartments.mockResolvedValue({
      departments: [],
    })
    adminApiService.getActivityLog.mockResolvedValue({
      data: [],
    })
    adminApiService.createActivityLogEntry.mockResolvedValue({
      data: {
        id: 'activity-1',
        action: 'Sample action',
        detail: 'Sample detail',
        createdAt: '2026-03-10T08:30:00.000Z',
      },
    })
    adminApiService.listNotifications.mockResolvedValue({
      data: [],
    })
    adminApiService.updateNotificationReadState.mockResolvedValue({
      data: {
        id: 'notif-1',
        title: 'Sample notification',
        message: 'Sample message',
        type: 'Account',
        read: true,
        createdAt: '2026-03-10T08:30:00.000Z',
      },
    })
    adminApiService.clearNotifications.mockResolvedValue({
      data: {
        clearedCount: 0,
      },
    })
    adminApiService.listTransferRequests.mockResolvedValue({
      data: [
        {
          id: 'transfer-req-001',
          adminId: 'admin-office-001',
          adminName: 'BPLO Office Admin',
          currentDepartmentId: 'bplo',
          currentDepartmentLabel: 'Business Permits and Licensing Office (BPLO)',
          requestedDepartmentId: 'cto',
          requestedDepartmentLabel: 'City Treasury Office',
          reason: 'Operational reassignment',
          status: 'pending',
          createdAt: '2026-03-10T08:30:00.000Z',
          reviewedAt: '',
          reviewerId: '',
          reviewerName: '',
          reviewNotes: '',
        },
      ],
    })
    adminApiService.approveTransferRequest.mockResolvedValue({
      data: {
        id: 'transfer-req-001',
        adminId: 'admin-office-001',
        adminName: 'BPLO Office Admin',
        currentDepartmentId: 'bplo',
        currentDepartmentLabel: 'Business Permits and Licensing Office (BPLO)',
        requestedDepartmentId: 'cto',
        requestedDepartmentLabel: 'City Treasury Office',
        reason: 'Operational reassignment',
        status: 'approved',
        createdAt: '2026-03-10T08:30:00.000Z',
        reviewedAt: '2026-03-11T08:30:00.000Z',
        reviewerId: 'admin-super-001',
        reviewerName: 'City Superadmin',
        reviewNotes: 'Approved by superadmin',
      },
    })
    adminApiService.rejectTransferRequest.mockResolvedValue({
      data: {
        id: 'transfer-req-001',
        adminId: 'admin-office-001',
        adminName: 'BPLO Office Admin',
        currentDepartmentId: 'bplo',
        currentDepartmentLabel: 'Business Permits and Licensing Office (BPLO)',
        requestedDepartmentId: 'cto',
        requestedDepartmentLabel: 'City Treasury Office',
        reason: 'Operational reassignment',
        status: 'rejected',
        createdAt: '2026-03-10T08:30:00.000Z',
        reviewedAt: '2026-03-11T08:30:00.000Z',
        reviewerId: 'admin-super-001',
        reviewerName: 'City Superadmin',
        reviewNotes: 'Insufficient business need',
      },
    })

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)

    await act(async () => {
      root.render(<HookHarness />)
      await flushMicrotasks()
    })
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    latestState = undefined
    globalThis.IS_REACT_ACT_ENVIRONMENT = false
    vi.clearAllMocks()
  })

  it('keeps transfer, account, notification, and activity states consistent on approval', async () => {
    await act(async () => {
      await latestState.appActions.onApproveTransfer({
        requestId: 'transfer-req-001',
        reviewNotes: 'Approved by superadmin',
      })
    })

    const approvedRequest = latestState.appState.transferRequests.find(
      (request) => request.id === 'transfer-req-001'
    )
    expect(approvedRequest.status).toBe('Approved')
    expect(approvedRequest.reviewedById).toBe('admin-super-001')

    const updatedOfficeAdmin = latestState.appState.adminAccounts.find(
      (account) => account.id === 'admin-office-001'
    )
    expect(updatedOfficeAdmin.departmentId).toBe('cto')
    expect(updatedOfficeAdmin.department).toBe('City Treasury Office')

    const officeNotifications = latestState.appState.notificationsByAdmin['admin-office-001']
    expect(officeNotifications[0].title).toBe('Transfer approved')

    const reviewerNotifications = latestState.appState.notificationsByAdmin['admin-super-001']
    expect(reviewerNotifications[0].title).toBe('Transfer processed')

    expect(latestState.appState.activityLog[0].action).toBe('Department transfer approved')
  })

  it('keeps transfer, notification, and activity states consistent on rejection', async () => {
    await act(async () => {
      await latestState.appActions.onRejectTransfer({
        requestId: 'transfer-req-001',
        reviewNotes: 'Insufficient business need',
      })
    })

    const rejectedRequest = latestState.appState.transferRequests.find(
      (request) => request.id === 'transfer-req-001'
    )
    expect(rejectedRequest.status).toBe('Rejected')
    expect(rejectedRequest.reviewedById).toBe('admin-super-001')

    const officeNotifications = latestState.appState.notificationsByAdmin['admin-office-001']
    expect(officeNotifications[0].title).toBe('Transfer rejected')

    const reviewerNotifications = latestState.appState.notificationsByAdmin['admin-super-001']
    expect(reviewerNotifications[0].title).toBe('Transfer processed')

    expect(latestState.appState.activityLog[0].action).toBe('Department transfer rejected')
  })

  it('stores generated temporary passwords in notifications and reveals them only after re-authentication', async () => {
    await act(async () => {
      await latestState.appActions.onTemporaryPasswordCreated({
        fullName: 'New Citizen',
        email: 'new.citizen@citisent.gov',
        temporaryPassword: 'x9k3zv21',
      })
    })

    const notification = latestState.appState.notificationsByAdmin['admin-super-001'][0]

    expect(notification.title).toBe('Temporary password generated')
    expect(notification.meta.securePayload.kind).toBe('temporaryPassword')
    expect(notification.meta.securePayload.secret).toBe('x9k3zv21')
    expect(notification.read).toBe(false)

    let revealResult
    await act(async () => {
      revealResult = await latestState.appActions.onRevealTemporaryPassword({
        notificationId: notification.id,
        password: 'superadmin123',
      })
    })

    expect(authApiService.login).toHaveBeenCalledWith({
      email: 'superadmin@citisent.gov',
      identifier: 'superadmin@citisent.gov',
      password: 'superadmin123',
    })
    expect(revealResult.ok).toBe(true)
    expect(revealResult.temporaryPassword).toBe('x9k3zv21')
    expect(latestState.appState.notificationsByAdmin['admin-super-001'][0].read).toBe(true)
    expect(latestState.appState.activityLog[0].action).toBe('Temporary password revealed')
  })
})

describe('useAppStateOrchestrator access recovery integration', () => {
  let container
  let root

  beforeEach(async () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    window.localStorage.clear()
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const officeAdminProfile = {
      id: 'admin-office-003',
      fullName: 'Traffic Office Admin',
      email: 'traffic.admin@citisent.gov',
      departmentId: 'traffic',
      department: 'Traffic Management Office',
      role: 'Office Admin',
      phone: '+63 900 000 0003',
      address: 'City Annex',
      joinedAt: '2026-03-01T08:30:00.000Z',
      lastLoginAt: '',
      accountType: 'admin',
    }

    window.localStorage.setItem(ADMIN_STORAGE_KEYS.profile, schemaValue(officeAdminProfile))
    window.localStorage.setItem(ADMIN_STORAGE_KEYS.adminAccounts, schemaValue([officeAdminProfile]))
    window.localStorage.setItem(
      ADMIN_STORAGE_KEYS.notificationsByAdmin,
      schemaValue({ [officeAdminProfile.id]: [] })
    )
    window.localStorage.setItem(ADMIN_STORAGE_KEYS.transferRequests, schemaValue([]))
    window.localStorage.setItem(ADMIN_STORAGE_KEYS.accessToken, schemaValue('token-access-recovery'))
    window.localStorage.setItem(ADMIN_STORAGE_KEYS.authSession, schemaValue(true))
    window.localStorage.setItem(ADMIN_STORAGE_KEYS.activePage, schemaValue(APP_PAGES.DASHBOARD))

    authApiService.me
      .mockResolvedValueOnce({
        data: {
          id: officeAdminProfile.id,
          fullName: officeAdminProfile.fullName,
          email: officeAdminProfile.email,
          role: 'Office Admin',
          accountType: 'admin',
          departmentId: officeAdminProfile.departmentId,
          departmentLabel: officeAdminProfile.department,
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: officeAdminProfile.id,
          fullName: officeAdminProfile.fullName,
          email: officeAdminProfile.email,
          role: 'Superadmin',
          accountType: 'admin',
          departmentId: officeAdminProfile.departmentId,
          departmentLabel: officeAdminProfile.department,
        },
      })

    adminApiService.listTransferRequests.mockResolvedValue({ data: [] })
    adminApiService.getActivityLog.mockResolvedValue({ data: [] })
    adminApiService.createActivityLogEntry.mockResolvedValue({ data: null })
  adminApiService.getDepartments.mockResolvedValue({ departments: [] })
  adminApiService.listNotifications.mockResolvedValue({ data: [] })
  adminApiService.updateNotificationReadState.mockResolvedValue({ data: null })
  adminApiService.clearNotifications.mockResolvedValue({ data: { clearedCount: 0 } })

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)

    await act(async () => {
      root.render(<HookHarness />)
      await flushMicrotasks()
    })
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    latestState = undefined
    globalThis.IS_REACT_ACT_ENVIRONMENT = false
    vi.clearAllMocks()
  })

  it('revalidates profile before denying navigation to restricted admin pages', async () => {
    await act(async () => {
      await latestState.appActions.onNavigate(APP_PAGES.ADMIN_MANAGEMENT)
    })

    expect(authApiService.me).toHaveBeenCalledTimes(2)
    expect(latestState.appState.profile.role).toBe('Superadmin')
    expect(latestState.appState.activePage).toBe(APP_PAGES.ADMIN_MANAGEMENT)
  })
})
