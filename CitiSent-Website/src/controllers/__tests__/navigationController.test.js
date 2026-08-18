// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
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
  getPageFromPath,
  getPathFromPage,
  getRegisterAuthPage,
  getReportsCategoryPage,
  getUsersPage,
  syncBrowserHistory,
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

  describe('URL Routing and Browser History Sync', () => {
    it('maps page keys to clean URL pathnames', () => {
      expect(getPathFromPage(APP_PAGES.DASHBOARD)).toBe('/dashboard')
      expect(getPathFromPage(APP_PAGES.USERS)).toBe('/users')
      expect(getPathFromPage(APP_PAGES.REPORTS_BY_CATEGORY)).toBe('/reports/category')
      expect(getPathFromPage(APP_PAGES.REPORT_DETAIL, { id: 'REP-101' })).toBe('/reports/REP-101')
      expect(getPathFromPage(APP_PAGES.USER_PROFILE, { id: 'USR-202' })).toBe('/users/USR-202')
    })

    it('parses URL pathnames into corresponding page keys and parameters', () => {
      expect(getPageFromPath('/')).toEqual({ pageKey: APP_PAGES.DASHBOARD, params: {} })
      expect(getPageFromPath('/dashboard')).toEqual({ pageKey: APP_PAGES.DASHBOARD, params: {} })
      expect(getPageFromPath('/users')).toEqual({ pageKey: APP_PAGES.USERS, params: {} })
      expect(getPageFromPath('/reports/category')).toEqual({ pageKey: APP_PAGES.REPORTS_BY_CATEGORY, params: {} })
      expect(getPageFromPath('/reports/urgency')).toEqual({ pageKey: APP_PAGES.REPORTS_BY_URGENCY, params: {} })
      expect(getPageFromPath('/reports/history')).toEqual({ pageKey: APP_PAGES.REPORTS_HISTORY, params: {} })
      expect(getPageFromPath('/reports/REP-101')).toEqual({
        pageKey: APP_PAGES.REPORT_DETAIL,
        params: { reportId: 'REP-101' },
      })
      expect(getPageFromPath('/users/USR-202')).toEqual({
        pageKey: APP_PAGES.USER_PROFILE,
        params: { userId: 'USR-202' },
      })
      expect(getPageFromPath('/unknown-route')).toEqual({ pageKey: APP_PAGES.DASHBOARD, params: {} })
    })

    it('synchronizes browser history using pushState or replaceState', () => {
      const pushSpy = vi.spyOn(window.history, 'pushState').mockImplementation(() => {})
      const replaceSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})

      syncBrowserHistory({ pageKey: APP_PAGES.USERS })
      expect(pushSpy).toHaveBeenCalledWith({ pageKey: APP_PAGES.USERS, params: {} }, '', '/users')

      syncBrowserHistory({ pageKey: APP_PAGES.SETTINGS, replace: true })
      expect(replaceSpy).toHaveBeenCalledWith({ pageKey: APP_PAGES.SETTINGS, params: {} }, '', '/settings')

      pushSpy.mockRestore()
      replaceSpy.mockRestore()
    })
  })
})

