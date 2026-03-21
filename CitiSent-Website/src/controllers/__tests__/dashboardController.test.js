import { describe, expect, it } from 'vitest'
import { buildDashboardNewUserRows, buildDashboardStatCards } from '../dashboardController'

describe('dashboardController', () => {
  it('maps stat cards with icon components from icon keys', () => {
    const iconMap = {
      users: 'UsersIcon',
    }

    const statCards = [
      {
        id: 'total-users',
        iconKey: 'users',
        label: 'Total Users',
      },
    ]

    const result = buildDashboardStatCards({ statCards, iconMap })
    expect(result[0].icon).toBe('UsersIcon')
  })

  it('maps newest user rows to dashboard table shape', () => {
    const rows = [
      {
        username: 'Juan Dela Cruz',
        email: 'juan@example.com',
        joined: 'March 21, 2026',
      },
    ]

    expect(buildDashboardNewUserRows(rows)).toEqual([
      { username: 'Juan Dela Cruz', joined: 'March 21, 2026' },
    ])
  })
})
