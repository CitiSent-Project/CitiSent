import { useEffect, useRef, useState } from 'react'
import { APP_PAGES } from '../models/pageModel'
import { ADMIN_STORAGE_KEYS } from '../models/data'
import {
  buildPageNavigationTransition,
  buildReportDetailTransition,
  buildUserProfileTransition,
  getDashboardPage,
  getLogoutPage,
  getReportsCategoryPage,
  getUsersPage,
  getPageFromPath,
  syncBrowserHistory,
} from '../controllers/navigationController'
import { buildPageAccessDecision } from '../controllers/accessControlController'
import { getStorageSchemaRule } from '../models/storageSchemaModel'
import { loadFromStorageWithSchema } from '../services/storageService'
import { usePageLoadingState } from './usePageLoadingState'

function loadSchemaBackedValue(key, fallbackValue, overrides = {}) {
  const schemaRule = getStorageSchemaRule(key)

  return loadFromStorageWithSchema(key, fallbackValue, {
    schemaVersion: schemaRule.schemaVersion,
    migrate: overrides.migrate || schemaRule.migrate,
    validate: overrides.validate || schemaRule.validate,
  })
}

/**
 * Custom hook to manage navigation, routing, browser history, and active page state.
 */
export function useAdminNavigation({
  profile,
  activePage,
  setActivePage,
  selectedReportId,
  setSelectedReportId,
  isAuthenticated,
  reportStatusMap,
  refreshProfileForAccessCheck,
  addActivity,
  notifyError,
  isPageLoading,
  setIsPageLoading,
  selectedUserProfile,
  setSelectedUserProfile,
  selectedReport,
  setSelectedReport,
}) {
  const navigateThrottleRef = useRef(0)

  useEffect(() => {
    function handlePopState() {
      const { pageKey, params } = getPageFromPath(window.location.pathname)
      
      const accessDecision = buildPageAccessDecision({
        role: profile.role,
        requestedPage: pageKey,
      })

      if (!accessDecision.allowed) {
        notifyError('Access denied.', accessDecision.message)
        syncBrowserHistory({ pageKey: APP_PAGES.DASHBOARD, replace: true })
        setActivePage(APP_PAGES.DASHBOARD)
        return
      }

      setActivePage(pageKey)
      
      if (pageKey === APP_PAGES.REPORT_DETAIL && params.reportId) {
        setSelectedReportId(params.reportId)
      } else if (pageKey !== APP_PAGES.REPORT_DETAIL) {
        setSelectedReportId('')
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handlePopState)
      return () => {
        window.removeEventListener('popstate', handlePopState)
      }
    }
  }, [profile.role, notifyError, setActivePage, setSelectedReportId])

  usePageLoadingState({
    activePage,
    isAuthenticated,
    isPageLoading,
    setIsPageLoading,
  })

  async function handleNavigate(nextPage) {
    const now = Date.now()
    if (now - navigateThrottleRef.current < 300) {
      return
    }
    navigateThrottleRef.current = now

    let accessDecision = buildPageAccessDecision({
      role: profile.role,
      requestedPage: nextPage,
    })

    if (!accessDecision.allowed && refreshProfileForAccessCheck) {
      const refreshedProfile = await refreshProfileForAccessCheck()

      if (refreshedProfile) {
        accessDecision = buildPageAccessDecision({
          role: refreshedProfile.role,
          requestedPage: nextPage,
        })
      }
    }

    if (!accessDecision.allowed) {
      addActivity(accessDecision.activity.action, accessDecision.activity.detail)
      notifyError('Access denied.', accessDecision.message)
      return
    }

    const transition = buildPageNavigationTransition({ currentPage: activePage, nextPage })
    if (!transition) {
      return
    }

    syncBrowserHistory({ pageKey: transition.nextActivePage })

    setIsPageLoading(transition.shouldShowLoading)
    setActivePage(transition.nextActivePage)
  }

  function handleViewUserProfile(user) {
    const transition = buildUserProfileTransition({ user })
    setSelectedUserProfile(transition.selectedUserProfile)
    
    syncBrowserHistory({ pageKey: transition.nextActivePage, params: { id: user.id } })
    setActivePage(transition.nextActivePage)
  }

  function handleViewReport(report) {
    const transition = buildReportDetailTransition({ report, reportStatusMap })
    setSelectedReportId(report.id)
    setSelectedReport(transition.selectedReport)
    setIsPageLoading(transition.shouldShowLoading)
    
    syncBrowserHistory({ pageKey: transition.nextActivePage, params: { id: report.id } })
    setActivePage(transition.nextActivePage)
  }

  function handleBackToUsers() {
    syncBrowserHistory({ pageKey: getUsersPage() })
    setActivePage(getUsersPage())
  }

  function handleBackToReports() {
    setSelectedReportId('')
    syncBrowserHistory({ pageKey: getReportsCategoryPage() })
    setActivePage(getReportsCategoryPage())
  }

  function handleRequestLogout() {
    syncBrowserHistory({ pageKey: getLogoutPage() })
    setActivePage(getLogoutPage())
  }

  function handleCancelLogout() {
    syncBrowserHistory({ pageKey: getDashboardPage() })
    setActivePage(getDashboardPage())
  }

  return {
    handleNavigate,
    handleViewUserProfile,
    handleViewReport,
    handleBackToUsers,
    handleBackToReports,
    handleRequestLogout,
    handleCancelLogout,
  }
}
