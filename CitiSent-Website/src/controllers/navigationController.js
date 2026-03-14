import { APP_PAGES, AUTH_PAGES } from '../models/pageModel'
import { buildViewedReport } from './reportStateController'

export function buildPageNavigationTransition({ currentPage, nextPage }) {
  if (currentPage === nextPage) {
    return null
  }

  return {
    nextActivePage: nextPage,
    shouldShowLoading: true,
  }
}

export function buildUserProfileTransition({ user }) {
  return {
    selectedUserProfile: user,
    nextActivePage: APP_PAGES.USER_PROFILE,
  }
}

export function buildReportDetailTransition({ report, reportStatusMap }) {
  return {
    selectedReport: buildViewedReport({ report, reportStatusMap }),
    nextActivePage: APP_PAGES.REPORT_DETAIL,
    shouldShowLoading: true,
  }
}

export function getUsersPage() {
  return APP_PAGES.USERS
}

export function getReportsCategoryPage() {
  return APP_PAGES.REPORTS_BY_CATEGORY
}

export function getLogoutPage() {
  return APP_PAGES.LOGOUT
}

export function getDashboardPage() {
  return APP_PAGES.DASHBOARD
}

export function getLoginAuthPage() {
  return AUTH_PAGES.LOGIN
}

export function getRegisterAuthPage() {
  return AUTH_PAGES.REGISTER
}

export function buildPostRegistrationTransition() {
  return {
    nextAuthPage: AUTH_PAGES.LOGIN,
  }
}

export function buildPostLoginTransition({ nextActivePage }) {
  return {
    isAuthenticated: true,
    nextActivePage,
  }
}

export function buildPostLogoutTransition() {
  return {
    isAuthenticated: false,
    nextAuthPage: AUTH_PAGES.LOGIN,
  }
}
