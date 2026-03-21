/* @vitest-environment jsdom */
import { act, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStateOrchestrator } from '../useAppStateOrchestrator'
import { ADMIN_STORAGE_KEYS } from '../../models/data'
import { APP_PAGES } from '../../models/pageModel'

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

function schemaValue(payload, schemaVersion = 1) {
  return JSON.stringify({ schemaVersion, payload })
}

let latestState

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

  beforeEach(() => {
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
    window.localStorage.setItem(ADMIN_STORAGE_KEYS.authSession, schemaValue(true))
    window.localStorage.setItem(ADMIN_STORAGE_KEYS.activePage, schemaValue(APP_PAGES.DASHBOARD))

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)

    act(() => {
      root.render(<HookHarness />)
    })
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    latestState = undefined
    globalThis.IS_REACT_ACT_ENVIRONMENT = false
  })

  it('keeps transfer, account, notification, and activity states consistent on approval', () => {
    act(() => {
      latestState.appActions.onApproveTransfer({
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

  it('keeps transfer, notification, and activity states consistent on rejection', () => {
    act(() => {
      latestState.appActions.onRejectTransfer({
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
})
