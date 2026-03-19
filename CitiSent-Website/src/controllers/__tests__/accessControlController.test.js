import { describe, expect, it } from 'vitest'
import { APP_PAGES } from '../../models/pageModel'
import { USER_ROLES } from '../../models/roleAccessModel'
import { buildPageAccessDecision } from '../accessControlController'

describe('accessControlController', () => {
  it('allows office admins to access report pages', () => {
    const decision = buildPageAccessDecision({
      role: USER_ROLES.OFFICE_ADMIN,
      requestedPage: APP_PAGES.REPORTS_BY_CATEGORY,
    })

    expect(decision).toEqual({ allowed: true })
  })

  it('denies office admin access to users page', () => {
    const decision = buildPageAccessDecision({
      role: USER_ROLES.OFFICE_ADMIN,
      requestedPage: APP_PAGES.USERS,
    })

    expect(decision.allowed).toBe(false)
    expect(decision.activity.action).toBe('Access denied')
  })

  it('maps legacy Administrator role to superadmin access', () => {
    const decision = buildPageAccessDecision({
      role: 'Administrator',
      requestedPage: APP_PAGES.USERS,
    })

    expect(decision).toEqual({ allowed: true })
  })
})
