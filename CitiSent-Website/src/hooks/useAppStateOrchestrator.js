import { useState, useMemo } from 'react'
import { notifyError, notifySuccess, notifyErrorWithRetry } from '../components/ui/toastHelpers'
import {
  ADMIN_STORAGE_KEYS,
  DEFAULT_ADMIN_ACCOUNTS,
  DEFAULT_ADMIN_PROFILE,
  DEFAULT_PREFERENCES,
  DEFAULT_TRANSFER_REQUESTS,
} from '../models/data'
import { loadFromStorageWithSchema } from '../services/storageService'
import { usePersistToStorage } from './usePersistToStorage'
import { buildNextActivityLog } from '../controllers/activityController'
import { useAuthSession } from './useAuthSession'
import { useNotificationsState } from './useNotificationsState'
import { useDepartmentState, normalizeDepartmentOptions, normalizeDepartmentOption } from './useDepartmentState'
import { useAdminAccountsState } from './useAdminAccountsState'
import { useAdminTransferState } from './useAdminTransferState'
import { APP_PAGES, AUTH_PAGES } from '../models/pageModel'
import { normalizeUserRole, USER_ROLES } from '../models/roleAccessModel'
import { getStorageSchemaRule } from '../models/storageSchemaModel'
import { activityLogApiService } from '../services/api/admin/activityLogApiService'
import { notificationsApiService } from '../services/api/admin/notificationsApiService'
import { mapBackendNotification } from '../services/api/admin/notificationsApiMappers'
import { buildPageAccessDecision } from '../controllers/accessControlController'
import { getPageFromPath, syncBrowserHistory } from '../controllers/navigationController'

// Extracted hooks for better modularity
import { useDepartmentManagementState } from './useDepartmentManagementState'
import { useProfileAndPreferencesState } from './useProfileAndPreferencesState'
import { useAdminNavigation } from './useAdminNavigation'
import { useReportManagementState } from './useReportManagementState'
import { useSessionHydration } from './useSessionHydration'

function loadSchemaBackedValue(key, fallbackValue, overrides = {}) {
  const schemaRule = getStorageSchemaRule(key)

  return loadFromStorageWithSchema(key, fallbackValue, {
    schemaVersion: schemaRule.schemaVersion,
    migrate: overrides.migrate || schemaRule.migrate,
    validate: overrides.validate || schemaRule.validate,
  })
}

function getSchemaPersistenceOptions(storageKey) {
  return {
    withSchema: true,
    schemaVersion: getStorageSchemaRule(storageKey).schemaVersion,
  }
}

/**
 * Orchestrates high-level application state and dependencies across the Admin app.
 * Utilizes specialized custom hooks to separate domains such as navigation, 
 * profile updates, session hydration, and department management.
 */
export function useAppStateOrchestrator() {
  const storedProfile = loadSchemaBackedValue(ADMIN_STORAGE_KEYS.profile, DEFAULT_ADMIN_PROFILE)
  const storedAccessToken = loadSchemaBackedValue(ADMIN_STORAGE_KEYS.accessToken, '')
  const storedAuthSession = loadSchemaBackedValue(ADMIN_STORAGE_KEYS.authSession, false)

  const [authPage, setAuthPage] = useState(AUTH_PAGES.LOGIN)
  const [accessToken, setAccessToken] = useState(() =>
    storedAuthSession ? storedAccessToken : ''
  )
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(storedAccessToken) &&
    loadSchemaBackedValue(ADMIN_STORAGE_KEYS.authSession, false)
  )
  const [profile, setProfile] = useState(() => storedProfile)
  
  const [activePage, setActivePage] = useState(() => {
    let initialPage = loadSchemaBackedValue(ADMIN_STORAGE_KEYS.activePage, APP_PAGES.DASHBOARD)

    if (typeof window !== 'undefined') {
      const { pageKey } = getPageFromPath(window.location.pathname)
      if (pageKey) {
        initialPage = pageKey
      }
    }

    if (!Object.values(APP_PAGES).includes(initialPage)) {
      initialPage = APP_PAGES.DASHBOARD
    }

    if (initialPage === APP_PAGES.USER_PROFILE) {
      initialPage = APP_PAGES.USERS
    }

    const accessDecision = buildPageAccessDecision({
      role: storedProfile.role,
      requestedPage: initialPage,
    })

    const finalPage = accessDecision.allowed ? initialPage : APP_PAGES.DASHBOARD

    if (typeof window !== 'undefined') {
      setTimeout(() => {
        const { params } = getPageFromPath(window.location.pathname)
        syncBrowserHistory({ pageKey: finalPage, params, replace: true })
      }, 0)
    }

    return finalPage
  })
  
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [selectedUserProfile, setSelectedUserProfile] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)
  
  const [selectedReportId, setSelectedReportId] = useState(() => {
    if (typeof window !== 'undefined') {
      const { pageKey, params } = getPageFromPath(window.location.pathname)
      if (pageKey === APP_PAGES.REPORT_DETAIL && params.reportId) {
        return params.reportId
      }
    }
    return loadSchemaBackedValue(ADMIN_STORAGE_KEYS.selectedReportId, '')
  })

  const [adminAccounts, setAdminAccounts] = useState(() =>
    loadSchemaBackedValue(ADMIN_STORAGE_KEYS.adminAccounts, DEFAULT_ADMIN_ACCOUNTS)
  )
  const [preferences, setPreferences] = useState(() => {
    const storedValue = loadSchemaBackedValue(ADMIN_STORAGE_KEYS.preferences, DEFAULT_PREFERENCES)
    return {
      ...storedValue,
      displayName: storedValue.displayName || storedProfile.fullName,
      department: storedValue.department || storedProfile.department,
    }
  })
  const [notificationsByAdmin, setNotificationsByAdmin] = useState(() => {
    const storedNotificationsByAdmin = loadSchemaBackedValue(
      ADMIN_STORAGE_KEYS.notificationsByAdmin,
      null
    )

    if (
      storedNotificationsByAdmin &&
      typeof storedNotificationsByAdmin === 'object' &&
      !Array.isArray(storedNotificationsByAdmin)
    ) {
      return storedNotificationsByAdmin
    }

    return {}
  })
  const [activityLog, setActivityLog] = useState(() =>
    loadSchemaBackedValue(ADMIN_STORAGE_KEYS.activity, [])
  )
  const [transferRequests, setTransferRequests] = useState(() =>
    loadSchemaBackedValue(ADMIN_STORAGE_KEYS.transferRequests, DEFAULT_TRANSFER_REQUESTS)
  )
  const [rememberedEmail, setRememberedEmail] = useState(() =>
    loadSchemaBackedValue(ADMIN_STORAGE_KEYS.rememberEmail, '')
  )

  usePersistToStorage(ADMIN_STORAGE_KEYS.profile, profile, getSchemaPersistenceOptions(ADMIN_STORAGE_KEYS.profile))
  usePersistToStorage(ADMIN_STORAGE_KEYS.accessToken, accessToken, getSchemaPersistenceOptions(ADMIN_STORAGE_KEYS.accessToken))
  usePersistToStorage(ADMIN_STORAGE_KEYS.adminAccounts, adminAccounts, getSchemaPersistenceOptions(ADMIN_STORAGE_KEYS.adminAccounts))
  usePersistToStorage(ADMIN_STORAGE_KEYS.preferences, preferences, getSchemaPersistenceOptions(ADMIN_STORAGE_KEYS.preferences))
  usePersistToStorage(ADMIN_STORAGE_KEYS.notificationsByAdmin, notificationsByAdmin, getSchemaPersistenceOptions(ADMIN_STORAGE_KEYS.notificationsByAdmin))
  usePersistToStorage(ADMIN_STORAGE_KEYS.activity, activityLog, getSchemaPersistenceOptions(ADMIN_STORAGE_KEYS.activity))
  usePersistToStorage(ADMIN_STORAGE_KEYS.transferRequests, transferRequests, getSchemaPersistenceOptions(ADMIN_STORAGE_KEYS.transferRequests))
  usePersistToStorage(ADMIN_STORAGE_KEYS.rememberEmail, rememberedEmail, getSchemaPersistenceOptions(ADMIN_STORAGE_KEYS.rememberEmail))
  usePersistToStorage(ADMIN_STORAGE_KEYS.authSession, isAuthenticated, getSchemaPersistenceOptions(ADMIN_STORAGE_KEYS.authSession))
  usePersistToStorage(ADMIN_STORAGE_KEYS.activePage, activePage, getSchemaPersistenceOptions(ADMIN_STORAGE_KEYS.activePage))
  usePersistToStorage(ADMIN_STORAGE_KEYS.selectedReportId, selectedReportId, getSchemaPersistenceOptions(ADMIN_STORAGE_KEYS.selectedReportId))

  function addActivity(action, detail) {
    if (preferences.auditTrackingEnabled === false) {
      return
    }

    setActivityLog((previous) =>
      buildNextActivityLog({ previousActivityLog: previous, action, detail })
    )

    if (!accessToken || !profile.id) {
      return
    }

    activityLogApiService
      .createActivityLogEntry(accessToken, {
        action,
        detail,
      })
      .catch(() => {})
  }

  const {
    departmentOptions,
    departmentCatalog,
    refreshDepartmentsState,
    setDepartmentOptions,
    setDepartmentCatalog,
  } = useDepartmentState({
    accessToken,
    role: profile.role,
  })

  // 1. Session Hydration logic
  const {
    authReady,
    sessionBootstrapError,
    handleRetrySessionBootstrap,
    refreshProfileForAccessCheck,
  } = useSessionHydration({
    accessToken,
    setAccessToken,
    storedAuthSession,
    profile,
    setProfile,
    adminAccounts,
    setAdminAccounts,
    activePage,
    setActivePage,
    setIsAuthenticated,
    setPreferences,
    setTransferRequests,
    setNotificationsByAdmin,
    setActivityLog,
    setSelectedReport,
    setSelectedUserProfile,
    setActivePage,
    notifyError,
    notifyErrorWithRetry,
  })

  const { handleRefreshAdminAccounts } = useAdminAccountsState({
    accessToken,
    role: profile.role,
    setAdminAccounts,
    notifyError,
  })

  const {
    handleRegister,
    handleLogin,
    handleLogout,
    handleForgotPassword,
  } = useAuthSession({
    setAccessToken,
    setProfile,
    setAdminAccounts,
    setTransferRequests,
    setSelectedReport,
    setSelectedUserProfile,
    setPreferences,
    setActivePage,
    setIsAuthenticated,
    setAuthPage,
    setRememberedEmail,
    addActivity,
    notifySuccess,
    notifyError,
  })

  const {
    notifications,
    unreadNotifications,
    isClearing: isClearingNotifications,
    handleToggleNotification,
    handleClearNotifications,
  } = useNotificationsState({
    notificationsByAdmin,
    activeAdminId: profile.id,
    setNotificationsByAdmin,
    addActivity,
    notifySuccess,
    notifyError,
    persistToggleRead: async ({ notificationId, isRead }) => {
      if (String(notificationId).startsWith('notif-')) {
        return {
          notification: { id: notificationId, read: isRead },
        }
      }
      if (!accessToken) throw new Error('Your session has expired. Please sign in again.')
      const response = await notificationsApiService.updateNotificationReadState(
        accessToken,
        notificationId,
        {
          isRead,
          ...(normalizeUserRole(profile.role) === USER_ROLES.SUPERADMIN ? { adminId: profile.id } : {}),
        }
      )
      return { notification: mapBackendNotification(response?.data) }
    },
    persistClearAll: async () => {
      if (!accessToken) throw new Error('Your session has expired. Please sign in again.')
      await notificationsApiService.clearNotifications(accessToken, {
        clearAll: true,
        ...(normalizeUserRole(profile.role) === USER_ROLES.SUPERADMIN ? { adminId: profile.id } : {}),
      })
    },
  })

  const superadminRecipientIds = useMemo(
    () =>
      adminAccounts
        .filter((admin) => normalizeUserRole(admin.role) === USER_ROLES.SUPERADMIN)
        .map((admin) => admin.id)
        .filter((adminId) => adminId !== profile.id),
    [adminAccounts, profile.id]
  )

  const {
    handleSubmitTransferRequest,
    handleAssignOfficeDepartment,
    handleApproveTransfer,
    handleRejectTransfer,
  } = useAdminTransferState({
    accessToken,
    profile,
    transferRequests,
    superadminRecipientIds,
    setAdminAccounts,
    setTransferRequests,
    setProfile,
    setPreferences,
    setNotificationsByAdmin,
    addActivity,
    notifySuccess,
    notifyError,
  })

  // 2. Department Management logic
  const {
    handleCreateDepartment,
    handleUpdateDepartment,
    handleSetDepartmentActive,
    handleUpdateDepartmentLogo,
    handleDeleteDepartmentLogo,
    handleDeleteDepartment,
  } = useDepartmentManagementState({
    accessToken,
    profile,
    refreshDepartmentsState,
    addActivity,
    notifySuccess,
    notifyError,
  })

  // 3. Profile & Preferences logic
  const {
    handleProfileUpdate,
    handlePreferenceUpdate,
  } = useProfileAndPreferencesState({
    accessToken,
    isAuthenticated,
    preferences,
    departmentOptions,
    setProfile,
    setAdminAccounts,
    setPreferences,
    addActivity,
    notifySuccess,
    notifyError,
  })

  // 4. Report Management logic
  const {
    reportStatusMap,
    setReportStatusMap,
    handleReportStatusUpdate,
  } = useReportManagementState({
    accessToken,
    activePage,
    selectedReportId,
    selectedReport,
    setActivePage,
    setSelectedReportId,
    setSelectedReport,
    setIsPageLoading,
    notifyError,
  })

  // 5. Navigation logic
  const {
    handleNavigate,
    handleViewUserProfile,
    handleViewReport,
    handleBackToUsers,
    handleBackToReports,
    handleRequestLogout,
    handleCancelLogout,
  } = useAdminNavigation({
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
  })

  const appState = {
    authPage,
    activePage,
    isPageLoading,
    isAuthenticated,
    authReady,
    sessionBootstrapError,
    profile,
    activityLog,
    adminAccounts,
    notificationsByAdmin,
    notifications,
    unreadNotifications,
    isClearingNotifications,
    preferences,
    transferRequests,
    departmentOptions,
    departmentCatalog,
    rememberedEmail,
    selectedUserProfile,
    selectedReport,
    accessToken,
  }

  const appActions = {
    onRegister: handleRegister,
    onLogin: handleLogin,
    onForgotPassword: handleForgotPassword,
    onLogout: handleLogout,
    onRetrySessionBootstrap: handleRetrySessionBootstrap,
    onNavigate: handleNavigate,
    onViewUserProfile: handleViewUserProfile,
    onViewReport: handleViewReport,
    onUpdateProfile: handleProfileUpdate,
    onUpdatePreferences: handlePreferenceUpdate,
    onToggleRead: handleToggleNotification,
    onClearAll: handleClearNotifications,
    onRequestLogout: handleRequestLogout,
    onCancelLogout: handleCancelLogout,
    onBackToUsers: handleBackToUsers,
    onBackToReports: handleBackToReports,
    onUpdateReportStatus: handleReportStatusUpdate,
    onSubmitTransferRequest: handleSubmitTransferRequest,
    onAssignOfficeDepartment: handleAssignOfficeDepartment,
    onCreateDepartment: handleCreateDepartment,
    onUpdateDepartment: handleUpdateDepartment,
    onSetDepartmentActive: handleSetDepartmentActive,
    onUpdateDepartmentLogo: handleUpdateDepartmentLogo,
    onDeleteDepartmentLogo: handleDeleteDepartmentLogo,
    onDeleteDepartment: handleDeleteDepartment,
    onApproveTransfer: handleApproveTransfer,
    onRejectTransfer: handleRejectTransfer,
    onRefreshAdminAccounts: handleRefreshAdminAccounts,
    setAuthPage,
  }

  return {
    appState,
    appActions,
    authPage,
    activePage,
    isPageLoading,
    isAuthenticated,
    authReady,
    sessionBootstrapError,
    profile,
    activityLog,
    adminAccounts,
    notificationsByAdmin,
    notifications,
    unreadNotifications,
    preferences,
    transferRequests,
    departmentCatalog,
    rememberedEmail,
    selectedUserProfile,
    selectedReport,
    handleRegister,
    handleLogin,
    handleLogout,
    handleRetrySessionBootstrap,
    handleNavigate,
    handleViewUserProfile,
    handleViewReport,
    handleProfileUpdate,
    handlePreferenceUpdate,
    handleToggleNotification,
    handleClearNotifications,
    handleRequestLogout,
    handleCancelLogout,
    handleBackToUsers,
    handleBackToReports,
    handleReportStatusUpdate,
    handleSubmitTransferRequest,
    handleAssignOfficeDepartment,
    handleCreateDepartment,
    handleUpdateDepartment,
    handleSetDepartmentActive,
    handleUpdateDepartmentLogo,
    handleDeleteDepartmentLogo,
    handleDeleteDepartment,
    handleApproveTransfer,
    handleRejectTransfer,
    handleRefreshAdminAccounts,
    setAuthPage,
    departmentOptions,
  }
}
