import { describe, expect, it } from 'vitest'
import { APP_PAGES } from '../../models/pageModel'
import { USER_ROLES } from '../../models/roleAccessModel'
import { buildPageAccessDecision } from '../auth/accessControlController'

describe('accessControlController', () => {
  it('allows office admins to access report pages', () => {
    const decision = buildPageAccessDecision({
      role: USER_ROLES.OFFICE_ADMIN,
      requestedPage: APP_PAGES.REPORTS_BY_CATEGORY,
    })

    expect(decision).toEqual({ allowed: true })
  })

  it('allows office admins to access users page', () => {
    const decision = buildPageAccessDecision({
      role: USER_ROLES.OFFICE_ADMIN,
      requestedPage: APP_PAGES.USERS,
    })

    expect(decision).toEqual({ allowed: true })
  })

  it('maps legacy Administrator role to superadmin access', () => {
    const decision = buildPageAccessDecision({
      role: 'Administrator',
      requestedPage: APP_PAGES.USERS,
    })

    expect(decision).toEqual({ allowed: true })
  })
})
