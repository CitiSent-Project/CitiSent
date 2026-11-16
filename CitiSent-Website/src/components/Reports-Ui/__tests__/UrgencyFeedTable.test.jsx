import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { UrgencyFeedTable } from '../UrgencyFeedTable'

describe('UrgencyFeedTable', () => {
  it('renders AI-generated urgency in the existing report table', () => {
    const html = renderToStaticMarkup(
      <UrgencyFeedTable
        rows={[
          {
            id: 'report-101',
            name: 'Citizen One',
            email: 'citizen.one@example.com',
            location: 'Riverside',
            urgency: 'Critical',
            status: 'Pending',
            date: 'April 16, 2026',
          },
        ]}
      />,
    )

    expect(html).toContain('report-101')
    expect(html).toContain('citizen.one@example.com')
    expect(html).toContain('Riverside')
    expect(html).toContain('Critical')
    expect(html).toContain('Pending')
  })

  it('renders Guest in the Email column when row.isGuest is true', () => {
    const html = renderToStaticMarkup(
      <UrgencyFeedTable
        rows={[
          {
            id: 'ctmd-0002',
            reportNum: 'ctmd-0002',
            isGuest: true,
            email: 'guest_07fa240d_1790746307636@citisent.guest',
            location: 'Santiago, Maharlika Highway',
            urgency: 'Medium',
            emotionLevel: 'Frustrated',
            status: 'Pending',
            date: 'September 30, 2026',
          },
        ]}
      />,
    )

    expect(html).toContain('ctmd-0002')
    expect(html).toContain('Guest')
    expect(html).not.toContain('guest_07fa240d_1790746307636@citisent.guest')
  })
})
