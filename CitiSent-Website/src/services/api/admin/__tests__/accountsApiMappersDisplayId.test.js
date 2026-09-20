import { describe, it, expect } from 'vitest'
import {
  mapBackendUserToUiRow,
  mapBackendProfileToAdminProfile,
  mapBackendOfficeAdmin,
} from '../accountsApiMappers'

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
