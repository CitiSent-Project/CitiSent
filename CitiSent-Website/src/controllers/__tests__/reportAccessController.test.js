import { describe, expect, it } from 'vitest'
import { USER_ROLES } from '../../models/roleAccessModel'
import {
  canAdminUpdateReport,
  filterReportsForAdmin,
  getScopedAgencyFilters,
} from '../reportAccessController'

describe('reportAccessController', () => {
  const rows = [
    { id: 'R-1', categoryId: 'bplo' },
    { id: 'R-2', categoryId: 'cto' },
  ]

  it('returns all rows for superadmin', () => {
    const result = filterReportsForAdmin({
      rows,
      profile: { role: USER_ROLES.SUPERADMIN, departmentId: 'all' },
    })

    expect(result).toEqual(rows)
  })

  it('returns department-scoped rows for office admins', () => {
    const result = filterReportsForAdmin({
      rows,
      profile: { role: USER_ROLES.OFFICE_ADMIN, departmentId: 'cto' },
    })

    expect(result).toEqual([{ id: 'R-2', categoryId: 'cto' }])
  })

  it('checks update permission by report department', () => {
    expect(
      canAdminUpdateReport({
        profile: { role: USER_ROLES.OFFICE_ADMIN, departmentId: 'bplo' },
        report: { id: 'R-1', categoryId: 'bplo' },
      })
    ).toBe(true)

    expect(
      canAdminUpdateReport({
        profile: { role: USER_ROLES.OFFICE_ADMIN, departmentId: 'bplo' },
        report: { id: 'R-2', categoryId: 'cto' },
      })
    ).toBe(false)
  })

  it('scopes agency filters for office admin', () => {
    const agencies = [
      { id: 'bplo', label: 'BPLO' },
      { id: 'cto', label: 'CTO' },
    ]

    expect(
      getScopedAgencyFilters({
        agencies,
        profile: { role: USER_ROLES.OFFICE_ADMIN, departmentId: 'cto' },
      })
    ).toEqual([{ id: 'cto', label: 'CTO' }])
  })
})
