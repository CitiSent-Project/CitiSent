import { useState, useMemo, useEffect, useRef } from 'react'
import { notifyError, notifySuccess, notifyErrorWithRetry } from '../components/ui/toastHelpers'
import {
  ADMIN_STORAGE_KEYS,
  DEFAULT_ADMIN_ACCOUNTS,
  DEFAULT_ADMIN_PROFILE,
  DEFAULT_PREFERENCES,
  DEFAULT_TRANSFER_REQUESTS,
} from '../models/data'
import { loadFromStorageWithSchema } from '../services/storageService'
import { usePersistToStorage } from './shared/usePersistToStorage'
import { buildNextActivityLog } from '../controllers/shared/activityController'
import { useAuthSession } from './auth/useAuthSession'
import { useNotificationsState } from './useNotificationsState'
import { useDepartmentState } from './departments/useDepartmentState'
import { useAdminAccountsState } from './admin/useAdminAccountsState'
import { useAdminTransferState } from './admin/useAdminTransferState'
import { APP_PAGES, AUTH_PAGES } from '../models/pageModel'
import { normalizeUserRole, USER_ROLES } from '../models/roleAccessModel'
import { getStorageSchemaRule } from '../models/storageSchemaModel'
import { activityLogApiService } from '../services/api/admin/activityLogApiService'
import { notificationsApiService } from '../services/api/admin/notificationsApiService'
import { mapBackendNotification } from '../services/api/admin/notificationsApiMappers'
import {
  appendNotificationForAdmin,
  buildMessageNotification,
  hasUnreadMessageNotificationForReport,
} from '../controllers/shared/notificationsController'
import { buildPageAccessDecision } from '../controllers/auth/accessControlController'
import { getPageFromPath, syncBrowserHistory } from '../controllers/navigation/navigationController'
import { getSocket } from '../services/socket/socketService'

// Extracted hooks for better modularity
import { useDepartmentManagementState } from './departments/useDepartmentManagementState'
import { useProfileAndPreferencesState } from './useProfileAndPreferencesState'
import { useAdminNavigation } from './admin/useAdminNavigation'
import { useReportManagementState } from './reports/useReportManagementState'
import { useSessionHydration } from './auth/useSessionHydration'

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

  /**
   * Ref that ConversationsPage keeps updated with its current conversations list.
   * The global socket listener reads from this ref to look up sender name and
   * report number without requiring them as hook dependencies (avoids stale closures).
   */
  const globalConversationsRef = useRef([])

  /**
   * Global socket notification listener.
   *
   * Subscribes to server-persisted notification events so that every notification
   * displayed in the drawer is backed by a Supabase row with a stable UUID.
   * The `receive_message` event remains in charge of chat UI updates only.
   */
  useEffect(() => {
    if (!accessToken || !isAuthenticated || !profile.id) return

    const socket = getSocket(accessToken)
    if (!socket) return

    // Join the admin feed room to receive broadcast notifications.
    socket.emit('join_report_feed', {})

    /**
     * Prepend a new server-backed notification, deduplicating by persisted ID
     * and also by report conversation (to avoid duplicating when receive_message
     * also fires for the same incoming message).
     */
    function handleNewNotification(data) {
      if (!data?.notification) return

      const incoming = mapBackendNotification(data.notification)
      if (!incoming?.id) return

      const targetAdminId = data.adminId || profile.id

      setNotificationsByAdmin((previous) => {
        const current = previous[targetAdminId] || []
        // Skip if this UUID is already present (duplicate server emission).
        if (current.some((n) => n.id === incoming.id)) return previous

        // Also skip if we already have an unread message notification for this
        // report — the receive_message fallback may have created it first.
        const reportId = incoming.metadata?.reportId || incoming.meta?.reportId
        if (
          reportId &&
          hasUnreadMessageNotificationForReport({
            notificationsByAdmin: previous,
            adminId: targetAdminId,
            reportId: String(reportId),
          })
        ) {
          // Replace the local placeholder with the authoritative server-UUID version.
          return {
            ...previous,
            [targetAdminId]: current.map((n) => {
              const nReportId = n.metadata?.reportId || n.meta?.reportId
              if (
                !n.read &&
                String(n.type || '').toLowerCase() === 'message' &&
                String(nReportId || '') === String(reportId)
              ) {
                // Upgrade the placeholder to the server-backed record.
                return { ...n, ...incoming }
              }
              return n
            }),
          }
        }

        return appendNotificationForAdmin({
          notificationsByAdmin: previous,
          adminId: targetAdminId,
          notification: incoming,
        })
      })
    }

    /**
     * Global receive_message handler — runs in the orchestrator so the admin
     * receives a drawer notification regardless of which page is active.
     *
     * Acts as a fallback when the backend does not (yet) emit new_notification,
     * and also covers the window between message arrival and the server creating
     * the persisted notification row. Deduplicated so it never fires when a
     * matching unread notification already exists for the same report.
     */
    function handleGlobalReceiveMessage(data) {
      if (!data?.reportId || !data?.message) return

      const rawMessage = data.message
      const senderId = String(rawMessage.senderId || rawMessage.sender_id || '')
      const isOwn = profile.id && senderId === String(profile.id)

      // Only act on citizen-sent messages.
      if (isOwn || !senderId) return

      const reportId = String(data.reportId)
      const content = rawMessage.message || rawMessage.content || ''

      // Look up conversation metadata from the ref (kept current by ConversationsPage).
      const matchedConversation = globalConversationsRef.current.find(
        (conv) => String(conv.reportId) === reportId
      )
      const senderName = matchedConversation?.userName || 'Citizen'
      const reportNumber = matchedConversation?.reportNumber || ''

      setNotificationsByAdmin((previous) => {
        // Deduplicate: don't create a second notification if one already exists
        // for this report (e.g. new_notification arrived first).
        if (
          hasUnreadMessageNotificationForReport({
            notificationsByAdmin: previous,
            adminId: profile.id,
            reportId,
          })
        ) {
          return previous
        }

        return appendNotificationForAdmin({
          notificationsByAdmin: previous,
          adminId: profile.id,
          notification: buildMessageNotification({
            senderName,
            messageText: content,
            reportId,
            reportNumber,
          }),
        })
      })
    }

    /**
     * Replace a single notification with the server version (e.g. read-state update).
     */
    function handleNotificationUpdated(data) {
      if (!data?.notification) return

      const updated = mapBackendNotification(data.notification)
      if (!updated?.id) return

      const targetAdminId = data.adminId || profile.id

      setNotificationsByAdmin((previous) => ({
        ...previous,
        [targetAdminId]: (previous[targetAdminId] || []).map((n) =>
          n.id === updated.id ? { ...n, ...updated } : n
        ),
      }))
    }

    /**
     * Merge a batch of updated notifications by ID.
     */
    function handleNotificationsUpdated(data) {
      if (!Array.isArray(data?.notifications)) return

      const updatedMap = new Map(
        data.notifications
          .map(mapBackendNotification)
          .filter((n) => n?.id)
          .map((n) => [n.id, n])
      )
      if (updatedMap.size === 0) return

      const targetAdminId = data.adminId || profile.id

      setNotificationsByAdmin((previous) => ({
        ...previous,
        [targetAdminId]: (previous[targetAdminId] || []).map((n) =>
          updatedMap.has(n.id) ? { ...n, ...updatedMap.get(n.id) } : n
        ),
      }))
    }

    /**
     * Remove specified notification IDs (or clear the current user's list).
     */
    function handleNotificationsCleared(data) {
      const targetAdminId = data?.adminId || profile.id
      const idsToRemove = Array.isArray(data?.notificationIds) ? new Set(data.notificationIds) : null

      setNotificationsByAdmin((previous) => ({
        ...previous,
        [targetAdminId]: idsToRemove
          ? (previous[targetAdminId] || []).filter((n) => !idsToRemove.has(n.id))
          : [],
      }))
    }

    /**
     * On reconnect, refetch the authoritative notification list from the API
     * to recover any events that arrived while the socket was disconnected.
     */
    async function handleReconnect() {
      try {
        const response = await notificationsApiService.listNotifications(
          accessToken,
          normalizeUserRole(profile.role) === USER_ROLES.SUPERADMIN
            ? { adminId: profile.id, limit: 200, offset: 0 }
            : { limit: 200, offset: 0 }
        )
        const fetched = (response?.data || []).map(mapBackendNotification)
        setNotificationsByAdmin((previous) => ({
          ...previous,
          [profile.id]: fetched,
        }))
      } catch {
        // Reconnect refetch is best-effort; silently skip on failure.
      }
    }

    socket.on('receive_message', handleGlobalReceiveMessage)
    socket.on('new_notification', handleNewNotification)
    socket.on('notification_updated', handleNotificationUpdated)
    socket.on('notifications_updated', handleNotificationsUpdated)
    socket.on('notifications_cleared', handleNotificationsCleared)
    socket.on('reconnect', handleReconnect)

    return () => {
      socket.off('receive_message', handleGlobalReceiveMessage)
      socket.off('new_notification', handleNewNotification)
      socket.off('notification_updated', handleNotificationUpdated)
      socket.off('notifications_updated', handleNotificationsUpdated)
      socket.off('notifications_cleared', handleNotificationsCleared)
      socket.off('reconnect', handleReconnect)
    }
  }, [accessToken, isAuthenticated, profile.id, profile.role])

  /**
   * Called by ConversationsPage to keep the orchestrator's conversations ref
   * current so the global socket listener can look up sender/report metadata.
   */
  function handleGlobalConversationsSync(conversations) {
    globalConversationsRef.current = conversations || []
  }

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
    onSyncConversations: handleGlobalConversationsSync,
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
