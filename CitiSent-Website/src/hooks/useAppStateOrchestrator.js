import { useEffect, useMemo, useRef, useState } from 'react'
import { notifyError, notifyErrorWithRetry, notifySuccess } from '../components/ui/toastHelpers'
import {
  ADMIN_STORAGE_KEYS,
  DEFAULT_ADMIN_ACCOUNTS,
  DEFAULT_ADMIN_PROFILE,
  DEFAULT_PREFERENCES,
  DEFAULT_TRANSFER_REQUESTS,
} from '../models/data'
import { loadFromStorageWithSchema } from '../services/storageService'
import { usePersistToStorage } from './usePersistToStorage'
import { usePageLoadingState } from './usePageLoadingState'
import {
  buildPreferenceUpdateState,
  buildProfileUpdateState,
} from '../controllers/profileController'
import { buildAppearanceState } from '../controllers/appearanceController'
import { buildNextActivityLog } from '../controllers/activityController'
import {
  buildNextReportStatusMap,
  buildNextSelectedReport,
} from '../controllers/reportStateController'
import {
  buildPageNavigationTransition,
  buildReportDetailTransition,
  buildUserProfileTransition,
  getDashboardPage,
  getLogoutPage,
  getReportsCategoryPage,
  getUsersPage,
} from '../controllers/navigationController'
import { useAuthSession } from './useAuthSession'
import { useNotificationsState } from './useNotificationsState'
import { APP_PAGES, AUTH_PAGES } from '../models/pageModel'
import {
  appendNotificationForAdmin,
  appendNotificationForAdmins,
  buildNotification,
} from '../controllers/notificationsController'
import { buildPageAccessDecision } from '../controllers/accessControlController'
import { TRANSFER_REQUEST_STATUS } from '../controllers/departmentTransferController'
import { canReviewTransferRequest, normalizeUserRole, USER_ROLES } from '../models/roleAccessModel'
import { getStorageSchemaRule } from '../models/storageSchemaModel'
import { authApiService } from '../services/api/auth/authApiService'
import { activityLogApiService } from '../services/api/admin/activityLogApiService'
import { departmentsApiService } from '../services/api/admin/departmentsApiService'
import { notificationsApiService } from '../services/api/admin/notificationsApiService'
import { officeAdminsApiService } from '../services/api/admin/officeAdminsApiService'
import { reportsApiService } from '../services/api/admin/reportsApiService'
import { transferRequestsApiService } from '../services/api/admin/transferRequestsApiService'
import {
  mapBackendOfficeAdmin,
  mapBackendProfileToAdminProfile,
} from '../services/api/admin/accountsApiMappers'
import { mapBackendActivityLogEntry } from '../services/api/admin/activityLogApiMappers'
import { mapBackendNotification } from '../services/api/admin/notificationsApiMappers'
import {
  mapBackendReportToUiRow,
  mapUiStatusToBackendStatus,
} from '../services/api/admin/reportsApiMappers'
import { mapBackendTransferRequest } from '../services/api/admin/transferRequestsApiMappers'

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

function findDepartmentOption(value, departmentOptions) {
  return (
    departmentOptions.find(
      (department) => department.id === value || department.label === value
    ) || null
  )
}

function normalizeDepartmentOption(department) {
  if (!department || typeof department !== 'object') {
    return null
  }

  const id = String(department.id || department.slug || '').trim()
  const label = String(department.label || department.name || '').trim()

  if (!id || !label) {
    return null
  }

  return {
    id,
    agencyId: String(department.agencyId || department.agency_id || '').trim(),
    label,
    slug: String(department.slug || id).trim(),
    name: String(department.name || label).trim(),
    description: String(department.description || '').trim(),
    isActive: department.isActive !== false,
    logoPath: department.logoPath || department.logo_path || null,
    logoUrl: department.logoUrl || department.logo_url || null,
    createdAt: department.createdAt || null,
    updatedAt: department.updatedAt || null,
  }
}

function normalizeDepartmentOptions(departments) {
  return (Array.isArray(departments) ? departments : [])
    .map(normalizeDepartmentOption)
    .filter((department) => department !== null)
}

function isBackendUnavailableError(error) {
  const status = Number(error?.status)
  const message = String(error?.message || '').toLowerCase()

  if (Number.isFinite(status) && status >= 500) {
    return true
  }

  return (
    message.includes('unable to reach the api server') ||
    message.includes('request timed out') ||
    message.includes('networkerror') ||
    message.includes('failed to fetch') ||
    message.includes('service unavailable')
  )
}

function buildDeleteDepartmentOptions({ cleanup, reassignTo } = {}) {
  const options = {}

  if (cleanup === true) {
    options.cleanup = true
  }

  if (reassignTo) {
    options.reassignTo = reassignTo
  }

  return Object.keys(options).length > 0 ? options : undefined
}

export function useAppStateOrchestrator() {
  const [departmentOptions, setDepartmentOptions] = useState([])
  const [departmentCatalog, setDepartmentCatalog] = useState([])
  const navigateThrottleRef = useRef(0)
  const storedProfile = loadSchemaBackedValue(ADMIN_STORAGE_KEYS.profile, DEFAULT_ADMIN_PROFILE)
  const storedAccessToken = loadSchemaBackedValue(ADMIN_STORAGE_KEYS.accessToken, '')
  const storedAuthSession = loadSchemaBackedValue(ADMIN_STORAGE_KEYS.authSession, false)

  const [activePage, setActivePage] = useState(() => {
    const storedPage = loadSchemaBackedValue(ADMIN_STORAGE_KEYS.activePage, APP_PAGES.DASHBOARD)
    if (!Object.values(APP_PAGES).includes(storedPage)) {
      return APP_PAGES.DASHBOARD
    }

    // USER_PROFILE depends on transient in-memory state that is not persisted,
    // so redirect to the parent list page on reload.
    if (storedPage === APP_PAGES.USER_PROFILE) {
      return APP_PAGES.USERS
    }

    const accessDecision = buildPageAccessDecision({
      role: storedProfile.role,
      requestedPage: storedPage,
    })

    return accessDecision.allowed ? storedPage : APP_PAGES.DASHBOARD
  })
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [authPage, setAuthPage] = useState(AUTH_PAGES.LOGIN)
  const [accessToken, setAccessToken] = useState(() =>
    storedAuthSession ? storedAccessToken : ''
  )
  const [sessionBootstrapAttempt, setSessionBootstrapAttempt] = useState(0)
  const [sessionBootstrapError, setSessionBootstrapError] = useState(null)
  const [authReady, setAuthReady] = useState(() => !storedAuthSession || !storedAccessToken)
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(storedAccessToken) &&
    loadSchemaBackedValue(ADMIN_STORAGE_KEYS.authSession, false)
  )
  const [profile, setProfile] = useState(() => storedProfile)
  // Fetch active department options for all users and full catalog for superadmins.
  useEffect(() => {
    let isMounted = true

    async function hydrateDepartments() {
      try {
        const response = await departmentsApiService.getDepartments()
        if (isMounted) {
          const normalizedOptions = normalizeDepartmentOptions(response?.departments)
          setDepartmentOptions(normalizedOptions.filter((department) => department.isActive))
        }
      } catch {
        if (isMounted) {
          setDepartmentOptions([])
        }
      }

      if (normalizeUserRole(profile.role) !== USER_ROLES.SUPERADMIN || !accessToken) {
        if (isMounted) {
          setDepartmentCatalog([])
        }
        return
      }

      try {
        const response = await departmentsApiService.getDepartmentsCatalog(accessToken, {
          includeInactive: true,
        })

        if (isMounted) {
          setDepartmentCatalog(normalizeDepartmentOptions(response?.departments))
        }
      } catch {
        if (isMounted) {
          setDepartmentCatalog([])
        }
      }
    }

    hydrateDepartments()
    return () => {
      isMounted = false
    }
  }, [accessToken, profile.role])
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
  const [selectedUserProfile, setSelectedUserProfile] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)
  const [selectedReportId, setSelectedReportId] = useState(() =>
    loadSchemaBackedValue(ADMIN_STORAGE_KEYS.selectedReportId, '')
  )
  const [reportStatusMap, setReportStatusMap] = useState({})

  usePersistToStorage(
    ADMIN_STORAGE_KEYS.profile,
    profile,
    getSchemaPersistenceOptions(ADMIN_STORAGE_KEYS.profile)
  )
  usePersistToStorage(
    ADMIN_STORAGE_KEYS.accessToken,
    accessToken,
    getSchemaPersistenceOptions(ADMIN_STORAGE_KEYS.accessToken)
  )
  usePersistToStorage(
    ADMIN_STORAGE_KEYS.adminAccounts,
    adminAccounts,
    getSchemaPersistenceOptions(ADMIN_STORAGE_KEYS.adminAccounts)
  )
  usePersistToStorage(
    ADMIN_STORAGE_KEYS.preferences,
    preferences,
    getSchemaPersistenceOptions(ADMIN_STORAGE_KEYS.preferences)
  )
  usePersistToStorage(
    ADMIN_STORAGE_KEYS.notificationsByAdmin,
    notificationsByAdmin,
    getSchemaPersistenceOptions(ADMIN_STORAGE_KEYS.notificationsByAdmin)
  )
  usePersistToStorage(
    ADMIN_STORAGE_KEYS.activity,
    activityLog,
    getSchemaPersistenceOptions(ADMIN_STORAGE_KEYS.activity)
  )
  usePersistToStorage(
    ADMIN_STORAGE_KEYS.transferRequests,
    transferRequests,
    getSchemaPersistenceOptions(ADMIN_STORAGE_KEYS.transferRequests)
  )
  usePersistToStorage(
    ADMIN_STORAGE_KEYS.rememberEmail,
    rememberedEmail,
    getSchemaPersistenceOptions(ADMIN_STORAGE_KEYS.rememberEmail)
  )
  usePersistToStorage(
    ADMIN_STORAGE_KEYS.authSession,
    isAuthenticated,
    getSchemaPersistenceOptions(ADMIN_STORAGE_KEYS.authSession)
  )
  usePersistToStorage(
    ADMIN_STORAGE_KEYS.activePage,
    activePage,
    getSchemaPersistenceOptions(ADMIN_STORAGE_KEYS.activePage)
  )
  usePersistToStorage(
    ADMIN_STORAGE_KEYS.selectedReportId,
    selectedReportId,
    getSchemaPersistenceOptions(ADMIN_STORAGE_KEYS.selectedReportId)
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    function applyAppearance(systemPrefersDark) {
      const appearanceState = buildAppearanceState({
        themePreference: isAuthenticated ? preferences.theme : 'Light',
        fontSizePreference: preferences.fontSize,
        animationsEnabled: preferences.animationsEnabled,
        systemPrefersDark,
      })

      const root = document.documentElement
      root.dataset.theme = appearanceState.effectiveTheme
      root.style.fontSize = `${appearanceState.rootFontSizePx}px`
      root.classList.toggle('reduced-motion', !appearanceState.animationsEnabled)
    }

    applyAppearance(mediaQuery.matches)

    if (preferences.theme !== 'System' || !isAuthenticated) {
      return undefined
    }

    function handleSystemThemeChange(event) {
      applyAppearance(event.matches)
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [isAuthenticated, preferences.theme, preferences.fontSize, preferences.animationsEnabled])

  usePageLoadingState({
    activePage,
    isAuthenticated,
    isPageLoading,
    setIsPageLoading,
  })

  useEffect(() => {
    let isMounted = true

    async function hydrateSelectedReport() {
      if (
        activePage === APP_PAGES.REPORT_DETAIL &&
        !selectedReport &&
        selectedReportId &&
        accessToken
      ) {
        setIsPageLoading(true)
        try {
          const response = await reportsApiService.getReportById(accessToken, selectedReportId)
          if (isMounted && response?.data) {
            const mappedReport = mapBackendReportToUiRow(response.data)
            // Apply the viewed status adjustment if needed, similar to handleViewReport
            const mappedStatus = reportStatusMap[mappedReport.id] || mappedReport.status
            setSelectedReport({
              ...mappedReport,
              status: mappedStatus,
            })
          }
        } catch (error) {
          if (isMounted) {
            notifyError('Failed to load report.', error.message)
            setActivePage(APP_PAGES.REPORTS_BY_CATEGORY)
            setSelectedReportId('')
          }
        } finally {
          if (isMounted) {
            setIsPageLoading(false)
          }
        }
      }
    }

    hydrateSelectedReport()

    return () => {
      isMounted = false
    }
  }, [activePage, selectedReportId, accessToken, selectedReport, reportStatusMap])

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

  function handleRetrySessionBootstrap() {
    setSessionBootstrapError(null)
    setSessionBootstrapAttempt((previous) => previous + 1)
  }

  async function refreshDepartmentsState() {
    if (!accessToken) {
      setDepartmentOptions([])
      setDepartmentCatalog([])
      return
    }

    const activeResponse = await departmentsApiService.getDepartments(accessToken)
    const normalizedOptions = normalizeDepartmentOptions(activeResponse?.departments)
    setDepartmentOptions(normalizedOptions.filter((department) => department.isActive))

    if (normalizeUserRole(profile.role) !== USER_ROLES.SUPERADMIN || !accessToken) {
      setDepartmentCatalog([])
      return
    }

    const catalogResponse = await departmentsApiService.getDepartmentsCatalog(accessToken, {
      includeInactive: true,
    })
    setDepartmentCatalog(normalizeDepartmentOptions(catalogResponse?.departments))
  }

  async function handleRefreshAdminAccounts() {
    if (!accessToken || normalizeUserRole(profile.role) !== USER_ROLES.SUPERADMIN) {
      return
    }

    try {
      const response = await officeAdminsApiService.listOfficeAdmins(accessToken)
      const mappedOfficeAdmins = (response?.data || []).map(mapBackendOfficeAdmin)
      setAdminAccounts(mappedOfficeAdmins)
    } catch (error) {
      notifyError('Failed to refresh admin accounts.', error.message)
    }
  }

  async function refreshProfileForAccessCheck() {
    if (!accessToken) {
      return null
    }

    try {
      const meResponse = await authApiService.me(accessToken)
      const nextProfile = mapBackendProfileToAdminProfile(meResponse?.data)

      if (nextProfile.accountType !== 'admin' || !nextProfile.role) {
        return null
      }

      setProfile(nextProfile)
      setPreferences((previous) => ({
        ...previous,
        displayName: nextProfile.fullName || previous.displayName,
        department: nextProfile.department || previous.department,
      }))

      return nextProfile
    } catch {
      return null
    }
  }

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

  useEffect(() => {
    let isCancelled = false

    async function hydrateSession() {
      if (!accessToken) {
        setSessionBootstrapError(null)
        setAuthReady(true)
        return
      }

      setAuthReady(false)

      try {
        const meResponse = await authApiService.me(accessToken)
        const nextProfile = mapBackendProfileToAdminProfile(meResponse?.data)

        if (nextProfile.accountType !== 'admin' || !nextProfile.role) {
          throw new Error('This account does not have admin workspace access.')
        }

        const [transferResponse, officeAdminsResponse] = await Promise.all([
          transferRequestsApiService.listTransferRequests(accessToken),
          normalizeUserRole(nextProfile.role) === USER_ROLES.SUPERADMIN
            ? officeAdminsApiService.listOfficeAdmins(accessToken)
            : Promise.resolve({ data: [] }),
        ])

        const mappedOfficeAdmins = (officeAdminsResponse?.data || []).map(mapBackendOfficeAdmin)
        const notificationAdminIds = Array.from(
          new Set(
            [
              nextProfile.id,
              ...(normalizeUserRole(nextProfile.role) === USER_ROLES.SUPERADMIN
                ? mappedOfficeAdmins.map((admin) => admin.id)
                : []),
            ].filter(Boolean)
          )
        )

          const [activityResult, notificationsResult] = await Promise.allSettled([
            activityLogApiService.getActivityLog(accessToken, {
              limit: 200,
              offset: 0,
            }),
            Promise.allSettled(
              notificationAdminIds.map((adminId) =>
                notificationsApiService.listNotifications(
                  accessToken,
                  normalizeUserRole(nextProfile.role) === USER_ROLES.SUPERADMIN
                    ? { adminId, limit: 200, offset: 0 }
                    : { limit: 200, offset: 0 }
                )
            )
            ),
          ])

          const hydratedActivityLog =
            activityResult.status === 'fulfilled'
              ? (activityResult.value?.data || []).map(mapBackendActivityLogEntry)
              : null

          const notificationResponses =
            notificationsResult.status === 'fulfilled'
              ? notificationsResult.value
              : notificationAdminIds.map(() => ({ status: 'rejected' }))

        const hydratedNotificationsByAdmin = notificationAdminIds.reduce((accumulator, adminId, index) => {
          const response = notificationResponses[index]
          accumulator[adminId] =
            response?.status === 'fulfilled'
              ? (response.value?.data || []).map(mapBackendNotification)
              : []
          return accumulator
        }, {})

        if (isCancelled) {
          return
        }

        setSessionBootstrapError(null)
        setProfile(nextProfile)
        setIsAuthenticated(true)
        setPreferences((previous) => ({
          ...previous,
          displayName: nextProfile.fullName || previous.displayName,
          department: nextProfile.department || previous.department,
        }))
        setTransferRequests((transferResponse?.data || []).map(mapBackendTransferRequest))
        setAdminAccounts(mappedOfficeAdmins)
        setNotificationsByAdmin(hydratedNotificationsByAdmin)
        if (hydratedActivityLog) {
          setActivityLog(hydratedActivityLog)
        }
      } catch (error) {
        if (isCancelled) {
          return
        }

        if (isBackendUnavailableError(error)) {
          const fallbackMessage =
            error?.message || 'The backend is unavailable. Please retry in a few seconds.'

          setSessionBootstrapError({
            title: 'Unable to reach backend services',
            message: fallbackMessage,
          })

          notifyErrorWithRetry(
            'Session bootstrap interrupted.',
            fallbackMessage,
            handleRetrySessionBootstrap,
            'Retry bootstrap'
          )

          return
        }

        setAccessToken('')
        setIsAuthenticated(false)
        setSessionBootstrapError(null)
        setProfile(DEFAULT_ADMIN_PROFILE)
        setAdminAccounts([])
        setTransferRequests([])
        setSelectedReport(null)
        setSelectedUserProfile(null)
        setActivePage(APP_PAGES.DASHBOARD)
        notifyError('Session expired.', error.message)
      } finally {
        if (!isCancelled) {
          setAuthReady(true)
        }
      }
    }

    hydrateSession()

    return () => {
      isCancelled = true
    }
  }, [accessToken, sessionBootstrapAttempt])

  useEffect(() => {
    const relatedAdmins = profile.id
      ? [
          ...adminAccounts,
          {
            id: profile.id,
          },
        ]
      : adminAccounts

    setNotificationsByAdmin((previous) => {
      let didChange = false
      const next = { ...previous }

      relatedAdmins.forEach((admin) => {
        const adminId = admin?.id
        if (!adminId) {
          return
        }

        if (!Array.isArray(next[adminId])) {
          next[adminId] = []
          didChange = true
        }
      })

      return didChange ? next : previous
    })
  }, [adminAccounts, profile.id])

  async function handleProfileUpdate(updates) {
    if (!accessToken) {
      const message = 'Your session has expired. Please sign in again.'
      notifyError('Profile update failed.', message)
      return { ok: false, message }
    }

    const profileUpdateState = buildProfileUpdateState({
      currentPreferences: preferences,
      updates,
    })
    const selectedDepartment = findDepartmentOption(
      updates.department || updates.departmentId,
      departmentOptions
    )

    try {
      const response = await authApiService.updateCurrentUser(accessToken, {
        ...(updates.fname !== undefined ? { fname: updates.fname } : {}),
        ...(updates.mname !== undefined ? { mname: updates.mname } : {}),
        ...(updates.lname !== undefined ? { lname: updates.lname } : {}),
        ...(updates.username !== undefined ? { username: updates.username } : {}),
        ...(updates.email !== undefined ? { email: updates.email } : {}),
        ...(updates.phone !== undefined ? { phoneNumber: updates.phone } : {}),
        ...(updates.barangay !== undefined ? { barangay: updates.barangay } : {}),
        ...(updates.city !== undefined ? { city: updates.city } : {}),
        ...(updates.province !== undefined ? { province: updates.province } : {}),
        ...(selectedDepartment
          ? {
              departmentId: selectedDepartment.id,
              departmentLabel: selectedDepartment.label,
            }
          : {}),
      })

      const nextProfile = mapBackendProfileToAdminProfile(response?.data)

      setProfile(nextProfile)
      setAdminAccounts((previous) =>
        previous.map((admin) => (admin.id === nextProfile.id ? { ...admin, ...nextProfile } : admin))
      )

      if (profileUpdateState.nextPreferencesPatch) {
        setPreferences((previous) => ({
          ...previous,
          ...profileUpdateState.nextPreferencesPatch,
        }))
      }

      addActivity(profileUpdateState.activity.action, profileUpdateState.activity.detail)
      notifySuccess('Profile updated successfully.')
      return { ok: true, profile: nextProfile }
    } catch (error) {
      notifyError('Profile update failed.', error.message)
      return { ok: false, message: error.message }
    }
  }

  function handlePreferenceUpdate(updates) {
    const preferenceUpdateState = buildPreferenceUpdateState()
    setPreferences((previous) => ({ ...previous, ...updates }))
    addActivity(preferenceUpdateState.activity.action, preferenceUpdateState.activity.detail)
    notifySuccess('Settings updated successfully.')
  }

  const {
    notifications,
    unreadNotifications,
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
      if (!accessToken) {
        throw new Error('Your session has expired. Please sign in again.')
      }

      const response = await notificationsApiService.updateNotificationReadState(
        accessToken,
        notificationId,
        {
          isRead,
          ...(normalizeUserRole(profile.role) === USER_ROLES.SUPERADMIN
            ? { adminId: profile.id }
            : {}),
        }
      )

      return {
        notification: mapBackendNotification(response?.data),
      }
    },
    persistClearAll: async () => {
      if (!accessToken) {
        throw new Error('Your session has expired. Please sign in again.')
      }

      await notificationsApiService.clearNotifications(accessToken, {
        clearAll: true,
        ...(normalizeUserRole(profile.role) === USER_ROLES.SUPERADMIN
          ? { adminId: profile.id }
          : {}),
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

    if (!accessDecision.allowed) {
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

    setIsPageLoading(transition.shouldShowLoading)
    setActivePage(transition.nextActivePage)
  }

  function handleViewUserProfile(user) {
    const transition = buildUserProfileTransition({ user })
    setSelectedUserProfile(transition.selectedUserProfile)
    setActivePage(transition.nextActivePage)
  }

  function handleViewReport(report) {
    const transition = buildReportDetailTransition({ report, reportStatusMap })
    setSelectedReportId(report.id)
    setSelectedReport(transition.selectedReport)
    setIsPageLoading(transition.shouldShowLoading)
    setActivePage(transition.nextActivePage)
  }

  async function handleSubmitTransferRequest({
    requestedDepartmentId,
    requestedDepartmentLabel,
    reason,
  }) {
    if (!accessToken) {
      const message = 'Your session has expired. Please sign in again.'
      notifyError('Transfer request blocked.', message)
      return { ok: false, message }
    }

    const hasPendingRequest = transferRequests.some(
      (request) =>
        request.adminId === profile.id && request.status === TRANSFER_REQUEST_STATUS.PENDING
    )
    if (hasPendingRequest) {
      const message = 'You already have a pending transfer request.'
      notifyError('Transfer request blocked.', message)
      return { ok: false, message }
    }

    try {
      const response = await transferRequestsApiService.createTransferRequest(accessToken, {
        requestedDepartmentId,
        requestedDepartmentLabel,
        reason,
      })
      const createdRequest = mapBackendTransferRequest(response?.data)

      setTransferRequests((previous) => [createdRequest, ...previous])
      setNotificationsByAdmin((previous) => {
        let next = appendNotificationForAdmin({
          notificationsByAdmin: previous,
          adminId: profile.id,
          notification: buildNotification({
            title: 'Transfer request submitted',
            message: `Your request to transfer to ${requestedDepartmentLabel} is pending review.`,
            type: 'Account',
          }),
        })

        if (superadminRecipientIds.length > 0) {
          next = appendNotificationForAdmins({
            notificationsByAdmin: next,
            adminIds: superadminRecipientIds,
            notification: buildNotification({
              title: 'New transfer request',
              message: `${profile.fullName} requested transfer to ${requestedDepartmentLabel}.`,
              type: 'Account',
            }),
          })
        }

        return next
      })
      addActivity(
        'Department transfer requested',
        `${profile.fullName} requested transfer to ${requestedDepartmentLabel}`
      )
      notifySuccess('Transfer request submitted successfully.')
      return { ok: true, message: 'Transfer request submitted successfully.' }
    } catch (error) {
      notifyError('Transfer request blocked.', error.message)
      return { ok: false, message: error.message }
    }
  }

  async function handleAssignOfficeDepartment({ adminId, departmentId, departmentLabel }) {
    if (!canReviewTransferRequest(profile.role)) {
      notifyError('Assignment denied.', 'Only superadmins can update office-admin assignments.')
      return { ok: false }
    }

    if (!accessToken) {
      notifyError('Assignment denied.', 'Your session has expired. Please sign in again.')
      return { ok: false }
    }

    try {
      const response = await officeAdminsApiService.assignOfficeDepartment(accessToken, adminId, {
        departmentId,
        departmentLabel,
      })
      const updatedAdmin = mapBackendOfficeAdmin(response?.data)

      setAdminAccounts((previous) =>
        previous.map((admin) => (admin.id === adminId ? { ...admin, ...updatedAdmin } : admin))
      )

      if (profile.id === adminId) {
        setProfile((previous) => ({
          ...previous,
          departmentId: updatedAdmin.departmentId,
          department: updatedAdmin.department,
        }))
        setPreferences((previous) => ({
          ...previous,
          department: updatedAdmin.department,
        }))
      }

      setNotificationsByAdmin((previous) =>
        appendNotificationForAdmin({
          notificationsByAdmin: previous,
          adminId,
          notification: buildNotification({
            title: 'Department assignment updated',
            message: `Your assigned department is now ${updatedAdmin.department}.`,
            type: 'Account',
          }),
        })
      )

      addActivity('Office admin reassigned', `${updatedAdmin.fullName} moved to ${updatedAdmin.department}`)
      notifySuccess('Office-admin assignment updated.')
      return { ok: true, admin: updatedAdmin }
    } catch (error) {
      notifyError('Assignment denied.', error.message)
      return { ok: false, message: error.message }
    }
  }

  async function handleCreateDepartment({ slug, name, description }) {
    if (!canReviewTransferRequest(profile.role)) {
      notifyError('Creation denied.', 'Only superadmins can add departments.')
      return { ok: false }
    }

    if (!accessToken) {
      notifyError('Creation denied.', 'Your session has expired. Please sign in again.')
      return { ok: false }
    }

    try {
      const response = await departmentsApiService.createDepartment(accessToken, {
        slug,
        name,
        description,
      })
      const createdDepartment = normalizeDepartmentOption(response?.data)

      await refreshDepartmentsState()
      addActivity(
        'Department created',
        `${createdDepartment?.label || name} added to department catalog`
      )
      notifySuccess('Department added successfully.')
      return { ok: true, department: createdDepartment }
    } catch (error) {
      notifyError('Creation denied.', error.message)
      return { ok: false, message: error.message }
    }
  }

  async function handleUpdateDepartment({ departmentSlug, name, slug, description }) {
    if (!canReviewTransferRequest(profile.role)) {
      notifyError('Update denied.', 'Only superadmins can update departments.')
      return { ok: false }
    }

    if (!accessToken) {
      notifyError('Update denied.', 'Your session has expired. Please sign in again.')
      return { ok: false }
    }

    try {
      const response = await departmentsApiService.updateDepartment(
        accessToken,
        departmentSlug,
        {
          ...(name !== undefined ? { name } : {}),
          ...(slug !== undefined ? { slug } : {}),
          ...(description !== undefined ? { description } : {}),
        }
      )
      const updatedDepartment = normalizeDepartmentOption(response?.data)

      await refreshDepartmentsState()
      addActivity(
        'Department updated',
        `${updatedDepartment?.label || departmentSlug} details updated`
      )
      notifySuccess('Department updated successfully.')
      return { ok: true, department: updatedDepartment }
    } catch (error) {
      notifyError('Update denied.', error.message)
      return { ok: false, message: error.message }
    }
  }

  async function handleSetDepartmentActive({ departmentSlug, isActive }) {
    if (!canReviewTransferRequest(profile.role)) {
      notifyError('Status update denied.', 'Only superadmins can manage department status.')
      return { ok: false }
    }

    if (!accessToken) {
      notifyError('Status update denied.', 'Your session has expired. Please sign in again.')
      return { ok: false }
    }

    try {
      const response = await departmentsApiService.setDepartmentActive(
        accessToken,
        departmentSlug,
        isActive
      )
      const updatedDepartment = normalizeDepartmentOption(response?.data)

      await refreshDepartmentsState()
      addActivity(
        isActive ? 'Department activated' : 'Department deactivated',
        `${updatedDepartment?.label || departmentSlug} status set to ${
          isActive ? 'active' : 'inactive'
        }`
      )
      notifySuccess(
        `Department ${isActive ? 'activated' : 'deactivated'} successfully.`
      )
      return { ok: true, department: updatedDepartment }
    } catch (error) {
      notifyError('Status update denied.', error.message)
      return { ok: false, message: error.message }
    }
  }

  async function handleUpdateDepartmentLogo({ departmentSlug, departmentLabel, file }) {
    if (!canReviewTransferRequest(profile.role)) {
      notifyError('Logo update denied.', 'Only superadmins can manage department logos.')
      return { ok: false }
    }

    if (!accessToken) {
      notifyError('Logo update denied.', 'Your session has expired. Please sign in again.')
      return { ok: false }
    }

    try {
      const response = await departmentsApiService.updateDepartmentLogo(
        accessToken,
        departmentSlug,
        file
      )
      const updatedDepartment = normalizeDepartmentOption(response?.data)

      await refreshDepartmentsState()
      addActivity(
        'Department logo updated',
        `${updatedDepartment?.label || departmentLabel || departmentSlug} logo updated`
      )
      notifySuccess('Department logo updated successfully.')
      return { ok: true, department: updatedDepartment }
    } catch (error) {
      notifyError('Logo update denied.', error.message)
      return { ok: false, message: error.message }
    }
  }

  async function handleDeleteDepartmentLogo({ departmentSlug, departmentLabel }) {
    if (!canReviewTransferRequest(profile.role)) {
      notifyError('Logo delete denied.', 'Only superadmins can manage department logos.')
      return { ok: false }
    }

    if (!accessToken) {
      notifyError('Logo delete denied.', 'Your session has expired. Please sign in again.')
      return { ok: false }
    }

    try {
      const response = await departmentsApiService.deleteDepartmentLogo(
        accessToken,
        departmentSlug
      )
      const updatedDepartment = normalizeDepartmentOption(response?.data)

      await refreshDepartmentsState()
      addActivity(
        'Department logo removed',
        `${updatedDepartment?.label || departmentLabel || departmentSlug} logo removed`
      )
      notifySuccess('Department logo removed successfully.')
      return { ok: true, department: updatedDepartment }
    } catch (error) {
      notifyError('Logo delete denied.', error.message)
      return { ok: false, message: error.message }
    }
  }

  async function handleDeleteDepartment({
    departmentSlug,
    departmentLabel,
    cleanup,
    reassignTo,
  }) {
    if (!canReviewTransferRequest(profile.role)) {
      notifyError('Delete denied.', 'Only superadmins can delete departments.')
      return { ok: false }
    }

    if (!accessToken) {
      notifyError('Delete denied.', 'Your session has expired. Please sign in again.')
      return { ok: false }
    }

    try {
      const deleteOptions = buildDeleteDepartmentOptions({
        cleanup,
        reassignTo,
      })

      const response = await departmentsApiService.deleteDepartment(
        accessToken,
        departmentSlug,
        deleteOptions
      )
      const deletedDepartment = normalizeDepartmentOption(response?.data)

      await refreshDepartmentsState()
      addActivity(
        'Department deleted',
        `${deletedDepartment?.label || departmentLabel || departmentSlug} removed from department catalog`
      )
      notifySuccess('Department deleted successfully.')
      return { ok: true, department: deletedDepartment }
    } catch (error) {
      notifyError('Delete denied.', error.message)
      return {
        ok: false,
        message: error.message,
        details: error?.details || null,
        status: error?.status || null,
      }
    }
  }

  async function handleApproveTransfer({ requestId, reviewNotes }) {
    if (!canReviewTransferRequest(profile.role)) {
      notifyError('Approval denied.', 'Only superadmins can approve transfer requests.')
      return { ok: false }
    }

    if (!accessToken) {
      notifyError('Approval denied.', 'Your session has expired. Please sign in again.')
      return { ok: false }
    }

    const request = transferRequests.find((entry) => entry.id === requestId)
    if (!request || request.status !== TRANSFER_REQUEST_STATUS.PENDING) {
      notifyError('Approval failed.', 'The selected request is no longer pending.')
      return { ok: false }
    }

    try {
      const response = await transferRequestsApiService.approveTransferRequest(
        accessToken,
        requestId,
        {
        reviewNotes,
        }
      )
      const reviewedRequest = mapBackendTransferRequest(response?.data)

      setTransferRequests((previous) =>
        previous.map((entry) => (entry.id === requestId ? reviewedRequest : entry))
      )
      setAdminAccounts((previous) =>
        previous.map((admin) =>
          admin.id === request.adminId
            ? {
                ...admin,
                departmentId: reviewedRequest.requestedDepartmentId,
                department: reviewedRequest.requestedDepartmentLabel,
              }
            : admin
        )
      )

      if (profile.id === request.adminId) {
        setProfile((previous) => ({
          ...previous,
          departmentId: reviewedRequest.requestedDepartmentId,
          department: reviewedRequest.requestedDepartmentLabel,
        }))
        setPreferences((previous) => ({
          ...previous,
          department: reviewedRequest.requestedDepartmentLabel,
        }))
      }

      setNotificationsByAdmin((previous) => {
        let next = appendNotificationForAdmin({
          notificationsByAdmin: previous,
          adminId: request.adminId,
          notification: buildNotification({
            title: 'Transfer approved',
            message: `Your transfer request to ${reviewedRequest.requestedDepartmentLabel} has been approved.`,
            type: 'Account',
          }),
        })

        next = appendNotificationForAdmin({
          notificationsByAdmin: next,
          adminId: profile.id,
          notification: buildNotification({
            title: 'Transfer processed',
            message: `Approved transfer of ${reviewedRequest.adminName} to ${reviewedRequest.requestedDepartmentLabel}.`,
            type: 'Account',
          }),
        })

        return next
      })

      addActivity(
        'Department transfer approved',
        `${reviewedRequest.adminName} moved to ${reviewedRequest.requestedDepartmentLabel}`
      )
      notifySuccess('Transfer request approved.')
      return { ok: true, request: reviewedRequest }
    } catch (error) {
      notifyError('Approval failed.', error.message)
      return { ok: false, message: error.message }
    }
  }

  async function handleRejectTransfer({ requestId, reviewNotes }) {
    if (!canReviewTransferRequest(profile.role)) {
      notifyError('Rejection denied.', 'Only superadmins can reject transfer requests.')
      return { ok: false }
    }

    if (!accessToken) {
      notifyError('Rejection denied.', 'Your session has expired. Please sign in again.')
      return { ok: false }
    }

    const request = transferRequests.find((entry) => entry.id === requestId)
    if (!request || request.status !== TRANSFER_REQUEST_STATUS.PENDING) {
      notifyError('Rejection failed.', 'The selected request is no longer pending.')
      return { ok: false }
    }

    try {
      const response = await transferRequestsApiService.rejectTransferRequest(
        accessToken,
        requestId,
        {
        reviewNotes,
        }
      )
      const reviewedRequest = mapBackendTransferRequest(response?.data)

      setTransferRequests((previous) =>
        previous.map((entry) => (entry.id === requestId ? reviewedRequest : entry))
      )
      setNotificationsByAdmin((previous) => {
        let next = appendNotificationForAdmin({
          notificationsByAdmin: previous,
          adminId: request.adminId,
          notification: buildNotification({
            title: 'Transfer rejected',
            message: `Your transfer request to ${reviewedRequest.requestedDepartmentLabel} has been rejected.`,
            type: 'Account',
          }),
        })

        next = appendNotificationForAdmin({
          notificationsByAdmin: next,
          adminId: profile.id,
          notification: buildNotification({
            title: 'Transfer processed',
            message: `Rejected transfer of ${reviewedRequest.adminName} to ${reviewedRequest.requestedDepartmentLabel}.`,
            type: 'Account',
          }),
        })

        return next
      })

      addActivity(
        'Department transfer rejected',
        `${reviewedRequest.adminName} transfer request to ${reviewedRequest.requestedDepartmentLabel} was rejected`
      )
      notifySuccess('Transfer request rejected.')
      return { ok: true, request: reviewedRequest }
    } catch (error) {
      notifyError('Rejection failed.', error.message)
      return { ok: false, message: error.message }
    }
  }

  function handleBackToUsers() {
    setActivePage(getUsersPage())
  }

  function handleBackToReports() {
    setSelectedReportId('')
    setActivePage(getReportsCategoryPage())
  }

  function handleRequestLogout() {
    setActivePage(getLogoutPage())
  }

  function handleCancelLogout() {
    setActivePage(getDashboardPage())
  }

  async function handleReportStatusUpdate(reportId, newStatus, adminMessage) {
    if (!accessToken) {
      const message = 'Your session has expired. Please sign in again.'
      notifyError('Status update failed.', message)
      return { ok: false, message }
    }

    try {
      const response = await reportsApiService.updateReport(accessToken, reportId, {
        status: mapUiStatusToBackendStatus(newStatus),
        adminMessage,
      })
      const updatedReport = mapBackendReportToUiRow(response?.data)

      setReportStatusMap((prevMap) =>
        buildNextReportStatusMap({
          reportStatusMap: prevMap,
          reportId,
          nextStatus: updatedReport.status,
        })
      )
      setSelectedReport((prevSelectedReport) => {
        const nextSelectedReport = buildNextSelectedReport({
          selectedReport: prevSelectedReport,
          reportId,
          nextStatus: updatedReport.status,
        })

        return nextSelectedReport && nextSelectedReport.id === updatedReport.id
          ? { ...nextSelectedReport, ...updatedReport }
          : nextSelectedReport
      })

      return { ok: true, report: updatedReport }
    } catch (error) {
      notifyError('Status update failed.', error.message)
      return { ok: false, message: error.message }
    }
  }

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
    preferences,
    transferRequests,
    departmentOptions,
    departmentCatalog,
    rememberedEmail,
    selectedUserProfile,
    selectedReport,
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
