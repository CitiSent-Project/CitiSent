import { useEffect, useMemo, useState } from 'react'
import { Navbar } from './components/Navbar'
import { PageSkeleton } from './components/ui/PageSkeleton'
import Toasters from './components/ui/Toasters'
import { notifyError, notifySuccess } from './components/ui/toastHelpers'
import {
    ADMIN_STORAGE_KEYS,
    buildDefaultNotificationsByAdmin,
    DEFAULT_ADMIN_ACCOUNTS,
    DEFAULT_ADMIN_PROFILE,
    DEFAULT_NOTIFICATIONS,
    DEFAULT_PREFERENCES,
    DEFAULT_TRANSFER_REQUESTS,
} from './frontend/Data/adminPortalData'
import { loadFromStorage } from './services/storageService'
import { usePersistToStorage } from './hooks/usePersistToStorage'
import { usePageLoadingState } from './hooks/usePageLoadingState'
import {
    buildPreferenceUpdateState,
    buildProfileUpdateState,
} from './controllers/profileController'
import { buildAppearanceState } from './controllers/appearanceController'
import { buildNextActivityLog } from './controllers/activityController'
import {
    buildNextReportStatusMap,
    buildNextSelectedReport,
} from './controllers/reportStateController'
import { renderActivePage, renderAuthPage } from './controllers/pageRouterController'
import {
    buildPageNavigationTransition,
    buildReportDetailTransition,
    buildUserProfileTransition,
    getDashboardPage,
    getLoginAuthPage,
    getLogoutPage,
    getRegisterAuthPage,
    getReportsCategoryPage,
    getUsersPage,
} from './controllers/navigationController'
import { useAuthSession } from './hooks/useAuthSession'
import { useNotificationsState } from './hooks/useNotificationsState'
import { APP_PAGES, AUTH_PAGES } from './models/pageModel'
import {
    appendNotificationForAdmin,
    appendNotificationForAdmins,
    buildNotification,
} from './controllers/notificationsController'
import { buildPageAccessDecision } from './controllers/accessControlController'
import { buildOfficeAdminDepartmentAssignment } from './controllers/adminManagementController'
import {
    buildTransferApproval,
    buildTransferRejection,
    buildTransferRequestCreation,
    TRANSFER_REQUEST_STATUS,
} from './controllers/departmentTransferController'
import { canReviewTransferRequest, normalizeUserRole, USER_ROLES } from './models/roleAccessModel'

function App() {
    const storedProfile = loadFromStorage(ADMIN_STORAGE_KEYS.profile, DEFAULT_ADMIN_PROFILE)

    const [activePage, setActivePage] = useState(() => {
        const storedPage = loadFromStorage(ADMIN_STORAGE_KEYS.activePage, APP_PAGES.DASHBOARD)
        if (!Object.values(APP_PAGES).includes(storedPage)) {
            return APP_PAGES.DASHBOARD
        }

        const accessDecision = buildPageAccessDecision({
            role: storedProfile.role,
            requestedPage: storedPage,
        })

        return accessDecision.allowed ? storedPage : APP_PAGES.DASHBOARD
    })
    const [isPageLoading, setIsPageLoading] = useState(false)
    const [authPage, setAuthPage] = useState(AUTH_PAGES.LOGIN)
    const [isAuthenticated, setIsAuthenticated] = useState(() =>
        loadFromStorage(ADMIN_STORAGE_KEYS.authSession, false)
    )
    const [profile, setProfile] = useState(() => storedProfile)
    const [adminAccounts, setAdminAccounts] = useState(() =>
        loadFromStorage(ADMIN_STORAGE_KEYS.adminAccounts, DEFAULT_ADMIN_ACCOUNTS)
    )
    const [preferences, setPreferences] = useState(() => {
        const storedValue = loadFromStorage(ADMIN_STORAGE_KEYS.preferences, DEFAULT_PREFERENCES)
        return {
            ...storedValue,
            displayName: storedValue.displayName || profile.fullName,
            department: storedValue.department || profile.department,
        }
    })
    const [notificationsByAdmin, setNotificationsByAdmin] = useState(() => {
        const storedNotificationsByAdmin = loadFromStorage(
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

        const legacyNotifications = loadFromStorage(
            ADMIN_STORAGE_KEYS.notifications,
            DEFAULT_NOTIFICATIONS
        )
        const seededNotifications = buildDefaultNotificationsByAdmin(adminAccounts)

        return {
            ...seededNotifications,
            [storedProfile.id]: legacyNotifications,
        }
    })
    const [activityLog, setActivityLog] = useState(() =>
        loadFromStorage(ADMIN_STORAGE_KEYS.activity, [])
    )
    const [transferRequests, setTransferRequests] = useState(() =>
        loadFromStorage(ADMIN_STORAGE_KEYS.transferRequests, DEFAULT_TRANSFER_REQUESTS)
    )
    const [rememberedEmail, setRememberedEmail] = useState(() =>
        loadFromStorage(ADMIN_STORAGE_KEYS.rememberEmail, '')
    )
    const [selectedUserProfile, setSelectedUserProfile] = useState(null)
    const [selectedReport, setSelectedReport] = useState(null)
    const [reportStatusMap, setReportStatusMap] = useState({})

    usePersistToStorage(ADMIN_STORAGE_KEYS.profile, profile)
    usePersistToStorage(ADMIN_STORAGE_KEYS.adminAccounts, adminAccounts)
    usePersistToStorage(ADMIN_STORAGE_KEYS.preferences, preferences)
    usePersistToStorage(ADMIN_STORAGE_KEYS.notificationsByAdmin, notificationsByAdmin)
    usePersistToStorage(ADMIN_STORAGE_KEYS.activity, activityLog)
    usePersistToStorage(ADMIN_STORAGE_KEYS.transferRequests, transferRequests)
    usePersistToStorage(ADMIN_STORAGE_KEYS.rememberEmail, rememberedEmail)
    usePersistToStorage(ADMIN_STORAGE_KEYS.authSession, isAuthenticated)
    usePersistToStorage(ADMIN_STORAGE_KEYS.activePage, activePage)

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

        function applyAppearance(systemPrefersDark) {
            const appearanceState = buildAppearanceState({
                themePreference: preferences.theme,
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

        if (preferences.theme !== 'System') {
            return undefined
        }

        function handleSystemThemeChange(event) {
            applyAppearance(event.matches)
        }

        mediaQuery.addEventListener('change', handleSystemThemeChange)
        return () => {
            mediaQuery.removeEventListener('change', handleSystemThemeChange)
        }
    }, [preferences.theme, preferences.fontSize, preferences.animationsEnabled])

    usePageLoadingState({
        activePage,
        isAuthenticated,
        isPageLoading,
        setIsPageLoading,
    })

    function addActivity(action, detail) {
        setActivityLog((previous) =>
            buildNextActivityLog({ previousActivityLog: previous, action, detail })
        )
    }

    const { handleRegister, handleLogin, handleLogout } = useAuthSession({
        profile,
        adminAccounts,
        setAdminAccounts,
        setProfile,
        setPreferences,
        setActivePage,
        setIsAuthenticated,
        setAuthPage,
        setRememberedEmail,
        addActivity,
        notifySuccess,
        notifyError,
    })

    function handleProfileUpdate(updates) {
        const profileUpdateState = buildProfileUpdateState({
            currentPreferences: preferences,
            updates,
        })

        setProfile((previous) => ({ ...previous, ...updates }))
        setAdminAccounts((previous) =>
            previous.map((admin) =>
                admin.id === profile.id
                    ? {
                          ...admin,
                          ...updates,
                      }
                    : admin
            )
        )

        if (profileUpdateState.nextPreferencesPatch) {
            setPreferences((previous) => ({
                ...previous,
                ...profileUpdateState.nextPreferencesPatch,
            }))
        }

        addActivity(profileUpdateState.activity.action, profileUpdateState.activity.detail)
        notifySuccess('Profile updated successfully.')
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
    })

    const superadminRecipientIds = useMemo(
        () =>
            adminAccounts
                .filter((admin) => normalizeUserRole(admin.role) === USER_ROLES.SUPERADMIN)
                .map((admin) => admin.id)
                .filter((adminId) => adminId !== profile.id),
        [adminAccounts, profile.id]
    )

    function handleNavigate(nextPage) {
        const accessDecision = buildPageAccessDecision({
            role: profile.role,
            requestedPage: nextPage,
        })
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
        setSelectedReport(transition.selectedReport)
        setIsPageLoading(transition.shouldShowLoading)
        setActivePage(transition.nextActivePage)
    }

    function handleSubmitTransferRequest({ requestedDepartmentId, requestedDepartmentLabel, reason }) {
        const hasPendingRequest = transferRequests.some(
            (request) =>
                request.adminId === profile.id && request.status === TRANSFER_REQUEST_STATUS.PENDING
        )
        if (hasPendingRequest) {
            const message = 'You already have a pending transfer request.'
            notifyError('Transfer request blocked.', message)
            return { ok: false, message }
        }

        const transferState = buildTransferRequestCreation({
            profile,
            requestedDepartmentId,
            requestedDepartmentLabel,
            reason,
        })

        setTransferRequests((previous) => [transferState.request, ...previous])
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
        addActivity(transferState.activity.action, transferState.activity.detail)
        notifySuccess('Transfer request submitted successfully.')
        return { ok: true, message: 'Transfer request submitted successfully.' }
    }

    function handleAssignOfficeDepartment({ adminId, departmentId, departmentLabel }) {
        if (!canReviewTransferRequest(profile.role)) {
            notifyError('Assignment denied.', 'Only superadmins can update office-admin assignments.')
            return
        }

        const assignmentState = buildOfficeAdminDepartmentAssignment({
            adminAccounts,
            adminId,
            nextDepartmentId: departmentId,
            nextDepartmentLabel: departmentLabel,
        })

        if (!assignmentState) {
            notifyError('Assignment skipped.', 'No assignment change was detected for this admin.')
            return
        }

        setAdminAccounts(assignmentState.nextAdminAccounts)

        if (profile.id === adminId) {
            setProfile((previous) => ({
                ...previous,
                departmentId,
                department: departmentLabel,
            }))
            setPreferences((previous) => ({
                ...previous,
                department: departmentLabel,
            }))
        }

        setNotificationsByAdmin((previous) =>
            appendNotificationForAdmin({
                notificationsByAdmin: previous,
                adminId,
                notification: buildNotification({
                    title: 'Department assignment updated',
                    message: `Your assigned department is now ${departmentLabel}.`,
                    type: 'Account',
                }),
            })
        )

        addActivity(assignmentState.activity.action, assignmentState.activity.detail)
        notifySuccess('Office-admin assignment updated.')
    }

    function handleApproveTransfer({ requestId, reviewNotes }) {
        if (!canReviewTransferRequest(profile.role)) {
            notifyError('Approval denied.', 'Only superadmins can approve transfer requests.')
            return
        }

        const request = transferRequests.find((entry) => entry.id === requestId)
        if (!request || request.status !== TRANSFER_REQUEST_STATUS.PENDING) {
            notifyError('Approval failed.', 'The selected request is no longer pending.')
            return
        }

        const transferState = buildTransferApproval({
            request,
            reviewerProfile: profile,
            reviewNotes,
        })

        setTransferRequests((previous) =>
            previous.map((entry) =>
                entry.id === requestId ? transferState.updatedRequest : entry
            )
        )

        setAdminAccounts((previous) =>
            previous.map((admin) =>
                admin.id === request.adminId
                    ? {
                          ...admin,
                          departmentId: request.requestedDepartmentId,
                          department: request.requestedDepartmentLabel,
                      }
                    : admin
            )
        )

        if (profile.id === request.adminId) {
            setProfile((previous) => ({
                ...previous,
                departmentId: request.requestedDepartmentId,
                department: request.requestedDepartmentLabel,
            }))
            setPreferences((previous) => ({
                ...previous,
                department: request.requestedDepartmentLabel,
            }))
        }

        setNotificationsByAdmin((previous) => {
            let next = appendNotificationForAdmin({
                notificationsByAdmin: previous,
                adminId: request.adminId,
                notification: transferState.notification,
            })

            next = appendNotificationForAdmin({
                notificationsByAdmin: next,
                adminId: profile.id,
                notification: buildNotification({
                    title: 'Transfer processed',
                    message: `Approved transfer of ${request.adminName} to ${request.requestedDepartmentLabel}.`,
                    type: 'Account',
                }),
            })

            return next
        })
        addActivity(transferState.activity.action, transferState.activity.detail)
        notifySuccess('Transfer request approved.')
    }

    function handleRejectTransfer({ requestId, reviewNotes }) {
        if (!canReviewTransferRequest(profile.role)) {
            notifyError('Rejection denied.', 'Only superadmins can reject transfer requests.')
            return
        }

        const request = transferRequests.find((entry) => entry.id === requestId)
        if (!request || request.status !== TRANSFER_REQUEST_STATUS.PENDING) {
            notifyError('Rejection failed.', 'The selected request is no longer pending.')
            return
        }

        const transferState = buildTransferRejection({
            request,
            reviewerProfile: profile,
            reviewNotes,
        })

        setTransferRequests((previous) =>
            previous.map((entry) =>
                entry.id === requestId ? transferState.updatedRequest : entry
            )
        )

        setNotificationsByAdmin((previous) => {
            let next = appendNotificationForAdmin({
                notificationsByAdmin: previous,
                adminId: request.adminId,
                notification: transferState.notification,
            })

            next = appendNotificationForAdmin({
                notificationsByAdmin: next,
                adminId: profile.id,
                notification: buildNotification({
                    title: 'Transfer processed',
                    message: `Rejected transfer of ${request.adminName} to ${request.requestedDepartmentLabel}.`,
                    type: 'Account',
                }),
            })

            return next
        })
        addActivity(transferState.activity.action, transferState.activity.detail)
        notifySuccess('Transfer request rejected.')
    }

    function handleBackToUsers() {
        setActivePage(getUsersPage())
    }

    function handleBackToReports() {
        setActivePage(getReportsCategoryPage())
    }

    function handleRequestLogout() {
        setActivePage(getLogoutPage())
    }

    function handleCancelLogout() {
        setActivePage(getDashboardPage())
    }

    function handleReportStatusUpdate(reportId, newStatus) {
        setReportStatusMap((prevMap) =>
            buildNextReportStatusMap({ reportStatusMap: prevMap, reportId, nextStatus: newStatus })
        )
        setSelectedReport((prevSelectedReport) =>
            buildNextSelectedReport({
                selectedReport: prevSelectedReport,
                reportId,
                nextStatus: newStatus,
            })
        )
    }

    if (!isAuthenticated) {
        return (
            <>
                <Toasters />
                {renderAuthPage({
                    authPage,
                    onRegister: handleRegister,
                    onSwitchToLogin: () => setAuthPage(getLoginAuthPage()),
                    onLogin: handleLogin,
                    onSwitchToRegister: () => setAuthPage(getRegisterAuthPage()),
                    rememberedEmail,
                })}
            </>
        )
    }

    return (
        <>
            <Toasters />
            <Navbar
                activePage={activePage}
                onNavigate={handleNavigate}
                profileRole={profile.role}
                unreadNotifications={unreadNotifications}
            >
                {isPageLoading ? (
                    <PageSkeleton pageKey={activePage} />
                ) : (
                    renderActivePage({
                        activePage,
                        onViewUserProfile: handleViewUserProfile,
                        onViewReport: handleViewReport,
                        profile,
                        activityLog,
                        adminAccounts,
                        onUpdateProfile: handleProfileUpdate,
                        notificationsByAdmin,
                        notifications,
                        onToggleRead: handleToggleNotification,
                        onClearAll: handleClearNotifications,
                        preferences,
                        onUpdatePreferences: handlePreferenceUpdate,
                        onRequestLogout: handleRequestLogout,
                        onConfirmLogout: handleLogout,
                        onCancelLogout: handleCancelLogout,
                        selectedUserProfile,
                        onBackToUsers: handleBackToUsers,
                        selectedReport,
                        onBackToReports: handleBackToReports,
                        onUpdateReportStatus: handleReportStatusUpdate,
                        transferRequests,
                        onSubmitTransferRequest: handleSubmitTransferRequest,
                        onAssignOfficeDepartment: handleAssignOfficeDepartment,
                        onApproveTransfer: handleApproveTransfer,
                        onRejectTransfer: handleRejectTransfer,
                    })
                )}
            </Navbar>
        </>
    )
}

export default App
