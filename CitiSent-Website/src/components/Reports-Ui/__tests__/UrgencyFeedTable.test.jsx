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
            location: 'Riverside',
            urgency: 'Critical',
            status: 'Pending',
            date: 'April 16, 2026',
          },
        ]}
      />,
    )

    expect(html).toContain('report-101')
    expect(html).toContain('Citizen One')
    expect(html).toContain('Riverside')
    expect(html).toContain('Critical')
    expect(html).toContain('Pending')
  })
})
