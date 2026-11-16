import { describe, expect, it } from 'vitest'

import {
  mapBackendConversationToUi,
  mapBackendReportToUiRow,
} from '../reportsApiMappers'

describe('reportsApiMappers', () => {
  it('maps AI-generated urgency from the backend report payload', () => {
    const row = mapBackendReportToUiRow({
      id: 'report-101',
      issueType: 'Flooding',
      description: 'Water level is rising quickly near the bridge.',
      location: 'Riverside',
      sentimentLabel: 'Critical',
      status: 'pending',
      createdAt: '2026-04-16T03:00:00.000Z',
      departmentId: 'bfp',
      departmentLabel: 'Bureau of Fire Protection (BFP) Processing Area',
      reporter: {
        id: 'citizen-1',
        fullName: 'Citizen One',
        email: 'citizen.one@citisent.gov',
      },
    })

    expect(row).toMatchObject({
      id: 'report-101',
      reportNum: 'report-101',
      name: 'Citizen One',
      email: 'citizen.one@citisent.gov',
      isGuest: false,
      location: 'Riverside',
      message: 'Water level is rising quickly near the bridge.',
      urgency: 'Critical',
      status: 'Pending',
      categoryId: 'bfp',
      category: 'Bureau of Fire Protection (BFP) Processing Area',
      resolvedAt: null,
    })
  })

  it('labels guest report email and name as Guest and sets isGuest: true when isGuest flag or @citisent.guest email is present', () => {
    const rowFromFlag = mapBackendReportToUiRow({
      id: 'ctmd-0002',
      reporter: {
        id: 'guest-1',
        isGuest: true,
        email: 'guest_07fa240d_1790746307636@citisent.guest',
      },
    })
    expect(rowFromFlag.isGuest).toBe(true)
    expect(rowFromFlag.email).toBe('Guest')
    expect(rowFromFlag.name).toBe('Guest')
    expect(rowFromFlag.reporter.email).toBe('Guest')

    const rowFromSyntheticEmail = mapBackendReportToUiRow({
      id: 'ctmd-0003',
      reporter: {
        id: 'guest-2',
        email: 'guest_60cda8c9_1790746371539@citisent.guest',
        fullName: 'guest_60cda8c9_1790746371539@citisent.guest',
      },
    })
    expect(rowFromSyntheticEmail.isGuest).toBe(true)
    expect(rowFromSyntheticEmail.email).toBe('Guest')
    expect(rowFromSyntheticEmail.name).toBe('Guest')

    const rowFromNullEmail = mapBackendReportToUiRow({
      id: 'ctmd-0004',
      reporter: {
        id: 'guest-3',
        email: null,
        fullName: 'Guest',
      },
    })
    expect(rowFromNullEmail.isGuest).toBe(true)
    expect(rowFromNullEmail.email).toBe('Guest')
    expect(rowFromNullEmail.name).toBe('Guest')
  })

  it('labels guest conversation userEmail and userName as Guest when isGuest is true', () => {
    const conv = mapBackendConversationToUi({
      id: 'ctmd-0002',
      reportNumber: 'ctmd-0002',
      reporter: {
        id: 'guest-1',
        email: 'guest_07fa240d_1790746307636@citisent.guest',
      },
    })

    expect(conv.isGuest).toBe(true)
    expect(conv.userEmail).toBe('Guest')
    expect(conv.userName).toBe('Guest')
  })

  it('maps resolvedAt when present, and falls back to updatedAt for resolved reports', () => {
    const rowWithResolvedAt = mapBackendReportToUiRow({
      id: 'report-102',
      status: 'resolved',
      resolvedAt: '2026-09-17T04:38:40.769Z',
      updatedAt: '2026-09-17T04:38:42.025Z',
    })
    expect(rowWithResolvedAt.resolvedAt).toBe('2026-09-17T04:38:40.769Z')

    const rowWithFallback = mapBackendReportToUiRow({
      id: 'report-103',
      status: 'rejected',
      resolvedAt: null,
      updatedAt: '2026-09-17T04:33:51.202Z',
    })
    expect(rowWithFallback.resolvedAt).toBe('2026-09-17T04:33:51.202Z')
  })
})
