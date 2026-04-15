import { describe, expect, it } from 'vitest'

import { mapBackendReportToUiRow } from '../reportsApiMappers'

describe('reportsApiMappers', () => {
  it('maps AI-generated urgency from the backend report payload', () => {
    const row = mapBackendReportToUiRow({
      id: 'report-101',
      issueType: 'Flooding',
      description: 'Water level is rising quickly near the bridge.',
      location: 'Riverside',
      sentimentLabel: 'Emergency',
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
      urgency: 'Emergency',
      status: 'Pending',
      categoryId: 'bfp',
      category: 'Bureau of Fire Protection (BFP) Processing Area',
    })
  })
})
