import { describe, it, expect } from 'vitest'
import {
  mapBackendUserToUiRow,
  mapBackendProfileToAdminProfile,
  mapBackendOfficeAdmin,
} from '../accountsApiMappers'
import { mapDashboardRecentUsers } from '../dashboardApiMappers'
import { formatRecentUsersCsv } from '../dashboardCsvFormatters'

describe('accountsApiMappers - displayId support', () => {
  it('mapBackendUserToUiRow correctly includes 6-digit displayId', () => {
    const rawUser = {
      id: 'c37b76eb-1461-49ee-9c2b-8e8bdcbbe45d',
      displayId: '849201',
      fname: 'Jane',
      lname: 'Doe',
      email: 'janedoe13@gmail.com',
      status: 'active',
    }

    const row = mapBackendUserToUiRow(rawUser)
    expect(row.id).toBe('c37b76eb-1461-49ee-9c2b-8e8bdcbbe45d')
    expect(row.displayId).toBe('849201')
    expect(row.name).toBe('Jane Doe')
    expect(row.isGuest).toBe(false)
  })

  it('mapBackendUserToUiRow labels guest user email and name as Guest when isGuest is true', () => {
    const guestUser = {
      id: 'guest-uuid-001',
      isGuest: true,
      role: 'guest',
      accountType: 'guest',
      email: 'guest_07fa240d_1790746307636@citisent.guest',
      fname: 'Guest',
      lname: 'User',
    }

    const row = mapBackendUserToUiRow(guestUser)
    expect(row.isGuest).toBe(true)
    expect(row.email).toBe('Guest')
    expect(row.name).toBe('Guest')
  })

  it('mapDashboardRecentUsers and formatRecentUsersCsv label guest users as Guest', () => {
    const rawUsers = [
      {
        id: 'guest-1',
        isGuest: true,
        email: 'guest_07fa240d_1790746307636@citisent.guest',
        joinedAt: '2026-09-30T00:00:00.000Z',
      },
      {
        id: 'citizen-1',
        email: 'mjanemanzo15@gmail.com',
        joinedAt: '2026-10-02T00:00:00.000Z',
      },
    ]

    const dashboardRows = mapDashboardRecentUsers(rawUsers)
    expect(dashboardRows[0].email).toBe('Guest')
    expect(dashboardRows[1].email).toBe('mjanemanzo15@gmail.com')

    const csv = formatRecentUsersCsv(rawUsers)
    expect(csv.rows[0].email).toBe('Guest')
    expect(csv.rows[1].email).toBe('mjanemanzo15@gmail.com')
  })

  it('mapBackendUserToUiRow falls back gracefully when displayId is absent', () => {
    const rawUser = {
      id: 'c37b76eb-1461-49ee-9c2b-8e8bdcbbe45d',
      email: 'janedoe13@gmail.com',
    }

    const row = mapBackendUserToUiRow(rawUser)
    expect(row.id).toBe('c37b76eb-1461-49ee-9c2b-8e8bdcbbe45d')
    expect(row.displayId).toBe('')
  })

  it('mapBackendProfileToAdminProfile and mapBackendOfficeAdmin map displayId', () => {
    const rawAdmin = {
      id: 'admin-uuid-123',
      display_id: '592014',
      fname: 'Admin',
      lname: 'User',
      email: 'admin@citisent.gov.ph',
    }

    const profile = mapBackendProfileToAdminProfile(rawAdmin)
    expect(profile.displayId).toBe('592014')

    const officeAdmin = mapBackendOfficeAdmin(rawAdmin)
    expect(officeAdmin.displayId).toBe('592014')
  })
})
