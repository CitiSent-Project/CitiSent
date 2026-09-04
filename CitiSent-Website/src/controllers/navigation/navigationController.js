import { APP_PAGES, AUTH_PAGES, PAGE_ROUTES } from '../../models/pageModel'
import { buildViewedReport } from '../reports/reportStateController'

/**
 * Resolves the URL pathname for a given application page key and parameters.
 *
 * @param {string} pageKey - The target APP_PAGES page identifier.
 * @param {Object} [params={}] - Dynamic route parameters (e.g., { id: 'R-101' }).
 * @returns {string} The formatted URL pathname string.
 */
export function getPathFromPage(pageKey, params = {}) {
  const routeTemplate = PAGE_ROUTES[pageKey] || PAGE_ROUTES[APP_PAGES.DASHBOARD]

  if (params?.id && routeTemplate.includes(':id')) {
    return routeTemplate.replace(':id', encodeURIComponent(params.id))
  }

  return routeTemplate
}

/**
 * Parses a browser URL pathname into its corresponding page key and parameters.
 *
 * @param {string} pathname - The window location pathname to evaluate.
 * @returns {{ pageKey: string, params: { reportId?: string, userId?: string } }} The resolved route object.
 */
export function getPageFromPath(pathname = '/') {
  const normalizedPath = pathname.trim().replace(/\/+$/, '') || '/'

  // Handle root URL path mapping
  if (normalizedPath === '/' || normalizedPath === PAGE_ROUTES[APP_PAGES.DASHBOARD]) {
    return { pageKey: APP_PAGES.DASHBOARD, params: {} }
  }

  // Exact path matches (excluding parametrized routes containing :id)
  const exactRouteMatch = Object.entries(PAGE_ROUTES).find(([, routePath]) => {
    return !routePath.includes(':id') && routePath === normalizedPath
  })

  if (exactRouteMatch) {
    return { pageKey: exactRouteMatch[0], params: {} }
  }

  // Parametrized route matching for Report Detail (/reports/:id)
  const reportDetailMatch = normalizedPath.match(/^\/reports\/([^/]+)$/)
  if (reportDetailMatch) {
    const rawId = decodeURIComponent(reportDetailMatch[1])
    // Guard against matching static sub-routes like /reports/category
    if (!['category', 'urgency', 'history'].includes(rawId)) {
      return {
        pageKey: APP_PAGES.REPORT_DETAIL,
        params: { reportId: rawId },
      }
    }
  }

  // Parametrized route matching for User Profile (/users/:id)
  const userProfileMatch = normalizedPath.match(/^\/users\/([^/]+)$/)
  if (userProfileMatch) {
    const rawId = decodeURIComponent(userProfileMatch[1])
    return {
      pageKey: APP_PAGES.USER_PROFILE,
      params: { userId: rawId },
    }
  }

  // Default fallback for unrecognized routes
  return { pageKey: APP_PAGES.DASHBOARD, params: {} }
}

/**
 * Synchronizes the current browser address bar and history stack using the HTML5 History API.
 *
 * @param {Object} options
 * @param {string} options.pageKey - Target page key to navigate to.
 * @param {Object} [options.params={}] - Optional route parameters (e.g. reportId or userId).
 * @param {boolean} [options.replace=false] - Whether to replace the current history entry instead of pushing a new entry.
 */
export function syncBrowserHistory({ pageKey, params = {}, replace = false }) {
  if (typeof window === 'undefined' || !window.history) {
    return
  }

  const targetPath = getPathFromPage(pageKey, params)
  const currentPath = window.location.pathname

  if (replace) {
    window.history.replaceState({ pageKey, params }, '', targetPath)
  } else if (currentPath !== targetPath) {
    window.history.pushState({ pageKey, params }, '', targetPath)
  }
}

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

