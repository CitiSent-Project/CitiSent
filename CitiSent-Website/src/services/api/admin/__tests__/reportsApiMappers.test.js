import { describe, expect, it } from 'vitest'

import { mapBackendReportToUiRow } from '../reportsApiMappers'

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
      location: 'Riverside',
      message: 'Water level is rising quickly near the bridge.',
      urgency: 'Critical',
      status: 'Pending',
      categoryId: 'bfp',
      category: 'Bureau of Fire Protection (BFP) Processing Area',
      resolvedAt: null,
    })
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
