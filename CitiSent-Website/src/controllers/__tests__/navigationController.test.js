import { describe, expect, it } from 'vitest'
import {
  buildPageNavigationTransition,
  buildPostLoginTransition,
  buildPostLogoutTransition,
  buildPostRegistrationTransition,
  buildReportDetailTransition,
  buildUserProfileTransition,
  getDashboardPage,
  getLoginAuthPage,
  getLogoutPage,
  getRegisterAuthPage,
  getReportsCategoryPage,
  getUsersPage,
} from '../navigationController'
import { APP_PAGES, AUTH_PAGES } from '../../models/pageModel'

describe('navigationController', () => {
  it('returns null when navigating to current page', () => {
    expect(
      buildPageNavigationTransition({
        currentPage: APP_PAGES.DASHBOARD,
        nextPage: APP_PAGES.DASHBOARD,
      })
    ).toBeNull()
  })

  it('builds page navigation transition for different page', () => {
    expect(
      buildPageNavigationTransition({
        currentPage: APP_PAGES.DASHBOARD,
        nextPage: APP_PAGES.USERS,
      })
    ).toEqual({
      nextActivePage: APP_PAGES.USERS,
      shouldShowLoading: true,
    })
  })

  it('builds user profile and report detail transitions', () => {
    const user = { id: 'U-1' }
    expect(buildUserProfileTransition({ user })).toEqual({
      selectedUserProfile: user,
      nextActivePage: APP_PAGES.USER_PROFILE,
    })

    const report = { id: 'R-9', status: 'Pending' }
    const reportTransition = buildReportDetailTransition({
      report,
      reportStatusMap: { 'R-9': 'Resolved' },
    })

    expect(reportTransition.nextActivePage).toBe(APP_PAGES.REPORT_DETAIL)
    expect(reportTransition.shouldShowLoading).toBe(true)
    expect(reportTransition.selectedReport.status).toBe('Resolved')
  })

  it('returns mapped page helpers and auth transition payloads', () => {
    expect(getUsersPage()).toBe(APP_PAGES.USERS)
    expect(getReportsCategoryPage()).toBe(APP_PAGES.REPORTS_BY_CATEGORY)
    expect(getLogoutPage()).toBe(APP_PAGES.LOGOUT)
    expect(getDashboardPage()).toBe(APP_PAGES.DASHBOARD)
    expect(getLoginAuthPage()).toBe(AUTH_PAGES.LOGIN)
    expect(getRegisterAuthPage()).toBe(AUTH_PAGES.REGISTER)

    expect(buildPostRegistrationTransition()).toEqual({ nextAuthPage: AUTH_PAGES.LOGIN })
    expect(buildPostLoginTransition({ nextActivePage: APP_PAGES.DASHBOARD })).toEqual({
      isAuthenticated: true,
      nextActivePage: APP_PAGES.DASHBOARD,
    })
    expect(buildPostLogoutTransition()).toEqual({
      isAuthenticated: false,
      nextAuthPage: AUTH_PAGES.LOGIN,
    })
  })
})
