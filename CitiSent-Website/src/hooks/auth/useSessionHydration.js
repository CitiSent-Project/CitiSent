import { useEffect, useState } from 'react'
import { authApiService } from '../../services/api/auth/authApiService'
import { activityLogApiService } from '../../services/api/admin/activityLogApiService'
import { notificationsApiService } from '../../services/api/admin/notificationsApiService'
import { officeAdminsApiService } from '../../services/api/admin/officeAdminsApiService'
import { transferRequestsApiService } from '../../services/api/admin/transferRequestsApiService'
import {
  mapBackendOfficeAdmin,
  mapBackendProfileToAdminProfile,
} from '../../services/api/admin/accountsApiMappers'
import { mapBackendActivityLogEntry } from '../../services/api/admin/activityLogApiMappers'
import { mapBackendNotification } from '../../services/api/admin/notificationsApiMappers'
import { mapBackendTransferRequest } from '../../services/api/admin/transferRequestsApiMappers'
import { APP_PAGES } from '../../models/pageModel'
import { DEFAULT_ADMIN_PROFILE } from '../../models/data'
import { normalizeUserRole, USER_ROLES } from '../../models/roleAccessModel'
import { runWithConcurrencyLimit } from '../../utils/concurrencyLimiter'
import { disconnectSocket } from '../../services/socket/socketService'

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

/**
 * Custom hook to manage the initialization, hydration, and error handling of the admin session.
 */
export function useSessionHydration({
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
}) {
  const [sessionBootstrapAttempt, setSessionBootstrapAttempt] = useState(0)
  const [sessionBootstrapError, setSessionBootstrapError] = useState(null)
  const [authReady, setAuthReady] = useState(() => !storedAuthSession || !accessToken)

  function handleRetrySessionBootstrap() {
    setSessionBootstrapError(null)
    setSessionBootstrapAttempt((previous) => previous + 1)
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
          notificationsApiService.listNotifications(
            accessToken,
            normalizeUserRole(nextProfile.role) === USER_ROLES.SUPERADMIN
              ? { adminId: nextProfile.id, limit: 200, offset: 0 }
              : { limit: 200, offset: 0 }
          ),
        ])

        const hydratedActivityLog =
          activityResult.status === 'fulfilled'
            ? (activityResult.value?.data || []).map(mapBackendActivityLogEntry)
            : null

        const hydratedNotificationsByAdmin = notificationAdminIds.reduce((accumulator, adminId) => {
          accumulator[adminId] = []
          return accumulator
        }, {})
        
        if (notificationsResult.status === 'fulfilled') {
          hydratedNotificationsByAdmin[nextProfile.id] = (notificationsResult.value?.data || []).map(mapBackendNotification)
        }

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

        // Disconnect socket when session is rejected (invalid/expired token).
        disconnectSocket()

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
  }, [accessToken, sessionBootstrapAttempt, setAccessToken, setProfile, setIsAuthenticated, setPreferences, setTransferRequests, setAdminAccounts, setNotificationsByAdmin, setActivityLog, setSelectedReport, setSelectedUserProfile, setActivePage, notifyError, notifyErrorWithRetry])

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
  }, [adminAccounts, profile.id, setNotificationsByAdmin])

  useEffect(() => {
    let isMounted = true

    async function hydrateOfficeAdminNotifications() {
      if (
        !accessToken ||
        activePage !== APP_PAGES.ADMIN_MANAGEMENT ||
        normalizeUserRole(profile.role) !== USER_ROLES.SUPERADMIN
      ) {
        return
      }

      const otherAdminIds = adminAccounts
        .map((admin) => admin.id)
        .filter((id) => id !== profile.id)

      if (otherAdminIds.length === 0) {
        return
      }

      const tasks = otherAdminIds.map(
        (adminId) => () =>
          notificationsApiService.listNotifications(accessToken, {
            adminId,
            limit: 200,
            offset: 0,
          })
      )

      const results = await runWithConcurrencyLimit(tasks, 3)

      if (!isMounted) {
        return
      }

      setNotificationsByAdmin((prev) => {
        const next = { ...prev }
        let changed = false

        otherAdminIds.forEach((adminId, index) => {
          const result = results[index]
          if (result.status === 'fulfilled') {
            next[adminId] = (result.value?.data || []).map(mapBackendNotification)
            changed = true
          }
        })

        return changed ? next : prev
      })
    }

    hydrateOfficeAdminNotifications()

    return () => {
      isMounted = false
    }
  }, [accessToken, activePage, profile.role, profile.id, adminAccounts, setNotificationsByAdmin])

  return {
    authReady,
    sessionBootstrapError,
    handleRetrySessionBootstrap,
    refreshProfileForAccessCheck,
  }
}
