import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ReportHistoryTable } from '../ReportHistoryTable'

describe('ReportHistoryTable', () => {
  it('renders formatted Date Completed when resolvedAt is provided', () => {
    const html = renderToStaticMarkup(
      <ReportHistoryTable
        rows={[
          {
            id: 'report-101',
            reportNum: 'bfp-0023',
            category: 'Bureau of Fire Protection',
            location: 'San Rafael',
            urgency: 'Medium',
            status: 'Resolved',
            date: 'September 17, 2026',
            resolvedAt: '2026-09-17T04:38:40.769Z',
          },
        ]}
      />,
    )

    expect(html).toContain('bfp-0023')
    expect(html).toContain('Resolved')
    expect(html).toContain('September 17, 2026')
    // Should NOT have N/A for Date Completed
    expect(html).not.toMatch(/<td[^>]*>N\/A<\/td>/)
  })

  it('falls back to updatedAt when resolvedAt is null on resolved or rejected reports', () => {
    const html = renderToStaticMarkup(
      <ReportHistoryTable
        rows={[
          {
            id: 'report-102',
            reportNum: 'cvo-0005',
            category: 'City Veterinary Office',
            location: 'San Miguel',
            urgency: 'Low',
            status: 'Rejected',
            date: 'September 17, 2026',
            resolvedAt: null,
            updatedAt: '2026-09-17T04:33:51.202Z',
          },
        ]}
      />,
    )

    expect(html).toContain('cvo-0005')
    expect(html).toContain('Rejected')
    // Should fall back to updatedAt instead of rendering N/A
    expect(html).not.toMatch(/<td[^>]*>N\/A<\/td>/)
  })
})
