/* @vitest-environment jsdom */
/**
 * useReportDetailState.test.js
 *
 * Focused tests for the extracted report-detail state hook.
 * Validates:
 *  - Missing report rendering (hook still initializes cleanly).
 *  - Unauthorized report update rejection.
 *  - Successful status update and timeline entry creation.
 *  - Permanently locked report state.
 *  - Suggestion loading failure fallback.
 *  - Timer cleanup on unmount.
 *  - Unread chat count behavior.
 */
import { act, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useReportDetailState } from '../reports/useReportDetailState'

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------
vi.mock('../../components/ui/toastHelpers', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}))

vi.mock('../../services/api/admin/reportsApiService', () => ({
  reportsApiService: {
    listReportMessages: vi.fn(),
    getReportAdminNoteSuggestions: vi.fn(),
    getReportById: vi.fn(() => Promise.resolve({ data: {} })),
  },
}))

vi.mock('../../services/storageService', () => ({
  loadFromStorageWithSchema: vi.fn(() => 'mock-access-token'),
}))

vi.mock('../../models/storageSchemaModel', () => ({
  getStorageSchemaRule: vi.fn(() => ({
    schemaVersion: 1,
    migrate: null,
    validate: null,
  })),
}))

import { notifySuccess } from '../../components/ui/toastHelpers'
import { reportsApiService } from '../../services/api/admin/reportsApiService'

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------
const MOCK_REPORT = {
  id: 'report-001',
  reportNum: 'RPT-0001',
  name: 'Juan Dela Cruz',
  email: 'juan@example.com',
  location: 'San Isidro Norte',
  category: 'Public Safety',
  categoryId: 'public-safety',
  source: 'Website',
  message: 'Broken streetlight on Main St.',
  urgency: 'Medium',
  emotionLevel: 'Frustrated',
  status: 'Pending',
  date: 'March 01, 2026',
  attachmentUrl: null,
  aiSummary: null,
}

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

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------
let latestState

function HookHarness({ report, profile, onUpdateStatus }) {
  const state = useReportDetailState({ report, profile, onUpdateStatus })

  useEffect(() => {
    latestState = state
  }, [state])

  return null
}

async function flushMicrotasks(iterations = 5) {
  for (let index = 0; index < iterations; index += 1) {
    await Promise.resolve()
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('useReportDetailState', () => {
  let container
  let root

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)

    // Default: empty messages and suggestions
    reportsApiService.listReportMessages.mockResolvedValue([])
    reportsApiService.getReportAdminNoteSuggestions.mockResolvedValue({
      data: { suggestedNotes: [] },
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

  // -------------------------------------------------------------------------
  // Missing report
  // -------------------------------------------------------------------------
  it('initializes cleanly when report is null', async () => {
    const onUpdateStatus = vi.fn()

    await act(async () => {
      root.render(
        <HookHarness report={null} profile={SUPERADMIN_PROFILE} onUpdateStatus={onUpdateStatus} />
      )
      await flushMicrotasks()
    })

    expect(latestState).toBeTruthy()
    // Should still return a valid state shape
    expect(latestState.currentStatus).toBe('Pending')
    expect(latestState.isPermanentlyLocked).toBe(false)
    expect(latestState.timeline).toHaveLength(1)
  })

  // -------------------------------------------------------------------------
  // Unauthorized update
  // -------------------------------------------------------------------------
  it('denies status update for admin outside the report department', async () => {
    const onUpdateStatus = vi.fn()
    // Office admin in BPLO trying to update a public-safety report
    const report = { ...MOCK_REPORT, categoryId: 'public-safety' }

    await act(async () => {
      root.render(
        <HookHarness report={report} profile={OFFICE_ADMIN_PROFILE} onUpdateStatus={onUpdateStatus} />
      )
      await flushMicrotasks()
    })

    expect(latestState.canProcessReport).toBe(false)
  })

  // -------------------------------------------------------------------------
  // Successful status update
  // -------------------------------------------------------------------------
  it('creates a timeline entry on successful status update', async () => {
    const onUpdateStatus = vi.fn().mockResolvedValue({ ok: true })

    await act(async () => {
      root.render(
        <HookHarness report={MOCK_REPORT} profile={SUPERADMIN_PROFILE} onUpdateStatus={onUpdateStatus} />
      )
      await flushMicrotasks()
    })

    // Change the selected status to "In Progress"
    act(() => {
      latestState.setSelectedStatus('In Progress')
    })

    // Set admin notes
    act(() => {
      latestState.setAdminNotes('Moving to in-progress for investigation.')
    })

    // Save the status
    await act(async () => {
      await latestState.handleStatusSave()
    })

    expect(onUpdateStatus).toHaveBeenCalledWith(
      'report-001',
      'In Progress',
      'Moving to in-progress for investigation.'
    )
    expect(latestState.timeline).toHaveLength(2)
    expect(latestState.timeline[1].action).toBe('Status changed to In Progress')
    expect(notifySuccess).toHaveBeenCalledWith('Report report-001 marked as In Progress.')
  })

  // -------------------------------------------------------------------------
  // Permanently locked report
  // -------------------------------------------------------------------------
  it('treats a Resolved report as permanently locked', async () => {
    const resolvedReport = { ...MOCK_REPORT, status: 'Resolved' }
    const onUpdateStatus = vi.fn()

    await act(async () => {
      root.render(
        <HookHarness report={resolvedReport} profile={SUPERADMIN_PROFILE} onUpdateStatus={onUpdateStatus} />
      )
      await flushMicrotasks()
    })

    expect(latestState.isPermanentlyLocked).toBe(true)
    expect(latestState.canProcessReport).toBe(false)
    expect(latestState.isSaveDisabled).toBe(true)
  })

  it('treats a Rejected report as permanently locked', async () => {
    const rejectedReport = { ...MOCK_REPORT, status: 'Rejected' }
    const onUpdateStatus = vi.fn()

    await act(async () => {
      root.render(
        <HookHarness report={rejectedReport} profile={SUPERADMIN_PROFILE} onUpdateStatus={onUpdateStatus} />
      )
      await flushMicrotasks()
    })

    expect(latestState.isPermanentlyLocked).toBe(true)
    expect(latestState.canProcessReport).toBe(false)
  })

  // -------------------------------------------------------------------------
  // Suggestion loading failure fallback
  // -------------------------------------------------------------------------
  it('falls back to empty suggestions when the API fails', async () => {
    reportsApiService.getReportAdminNoteSuggestions.mockRejectedValue(new Error('Service down'))
    const onUpdateStatus = vi.fn()

    await act(async () => {
      root.render(
        <HookHarness report={MOCK_REPORT} profile={SUPERADMIN_PROFILE} onUpdateStatus={onUpdateStatus} />
      )
      await flushMicrotasks()
    })

    expect(latestState.adminNoteSuggestions).toEqual([])
    expect(latestState.isAdminNoteSuggestionsLoading).toBe(false)
  })

  // -------------------------------------------------------------------------
  // Timer cleanup on unmount
  // -------------------------------------------------------------------------
  it('clears cooldown timer on unmount without errors', async () => {
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')
    const onUpdateStatus = vi.fn().mockResolvedValue({ ok: true })

    await act(async () => {
      root.render(
        <HookHarness report={MOCK_REPORT} profile={SUPERADMIN_PROFILE} onUpdateStatus={onUpdateStatus} />
      )
      await flushMicrotasks()
    })

    // Trigger a save to start the cooldown timer
    act(() => {
      latestState.setSelectedStatus('In Progress')
    })
    act(() => {
      latestState.setAdminNotes('Testing cooldown cleanup.')
    })
    await act(async () => {
      await latestState.handleStatusSave()
    })

    // Unmount the component — should clear the timer without throwing
    act(() => {
      root.unmount()
    })

    // clearTimeout should have been called during unmount cleanup
    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })

  // -------------------------------------------------------------------------
  // Unread chat count
  // -------------------------------------------------------------------------
  it('loads unread chat count from messages API', async () => {
    reportsApiService.listReportMessages.mockResolvedValue({
      data: [
        { id: 'msg-1', senderRole: 'citizen', isRead: false, content: 'Help!', createdAt: '2026-03-01T08:00:00Z' },
        { id: 'msg-2', senderRole: 'citizen', isRead: false, content: 'Please!', createdAt: '2026-03-01T08:01:00Z' },
        { id: 'msg-3', senderRole: 'admin', isRead: true, content: 'On it.', createdAt: '2026-03-01T08:02:00Z' },
      ],
    })
    const onUpdateStatus = vi.fn()

    await act(async () => {
      root.render(
        <HookHarness report={MOCK_REPORT} profile={SUPERADMIN_PROFILE} onUpdateStatus={onUpdateStatus} />
      )
      await flushMicrotasks()
    })

    // 2 unread citizen messages (admin messages are excluded)
    expect(latestState.unreadChatCount).toBe(2)
  })
})
