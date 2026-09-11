import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DashboardTableCard } from '../DashboardTableCard'

describe('DashboardTableCard', () => {
  it('renders desktop table and mobile card items cleanly with primary entity and metadata', () => {
    const columns = ['Name', 'Department Assigned', 'Last Activity']
    const rows = [
      {
        name: 'John Eduard Amistos',
        department: 'City Treasury Office',
        lastActivity: 'May 05, 2026',
      },
      {
        name: 'Office Admin Test',
        department: 'City Agriculture Office',
        lastActivity: 'March 24, 2026',
      },
    ]

    const html = renderToStaticMarkup(
      <DashboardTableCard title="Admins" columns={columns} rows={rows} />
    )

    expect(html).toContain('Admins')
    expect(html).toContain('John Eduard Amistos')
    expect(html).toContain('City Treasury Office')
    expect(html).toContain('May 05, 2026')
    expect(html).toContain('Office Admin Test')
    expect(html).toContain('City Agriculture Office')
    expect(html).toContain('March 24, 2026')
    expect(html).toContain('Department Assigned')
    expect(html).toContain('Last Activity')
  })

  it('renders empty state message when no data is provided', () => {
    const columns = ['Username', 'Date Joined']
    const html = renderToStaticMarkup(
      <DashboardTableCard title="Newly Joined Users" columns={columns} rows={[]} />
    )

    expect(html).toContain('Newly Joined Users')
    expect(html).toContain('No data available.')
  })
})
