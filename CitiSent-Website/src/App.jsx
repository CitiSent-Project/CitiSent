import { useEffect, useState } from 'react'
import { Navbar } from './components/Navbar'
import { PageSkeleton } from './components/ui/PageSkeleton'
import Toasters, { notifyError, notifySuccess } from './components/ui/Toasters'
import {
    ADMIN_STORAGE_KEYS,
    createActivityEntry,
    DEFAULT_ADMIN_PROFILE,
    DEFAULT_NOTIFICATIONS,
    DEFAULT_PREFERENCES,
} from './frontend/Data/adminPortalData'
import { loadFromStorage, saveToStorage } from './services/storageService'
import {
    buildLoginState,
    buildPreferenceUpdateState,
    buildProfileUpdateState,
    buildRegistrationState,
    validateLoginCredentials,
} from './controllers/authController'
import {
    buildClearNotificationsTransition,
    countUnreadNotifications,
    toggleNotificationReadState,
} from './controllers/notificationsController'
import {
    buildNextReportStatusMap,
    buildNextSelectedReport,
} from './controllers/reportStateController'
import { renderActivePage, renderAuthPage } from './controllers/pageRouterController'
import {
    buildPostLoginTransition,
    buildPostLogoutTransition,
    buildPostRegistrationTransition,
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
import { APP_PAGES, AUTH_PAGES } from './models/pageModel'

function App() {
    const [activePage, setActivePage] = useState(APP_PAGES.DASHBOARD)
    const [isPageLoading, setIsPageLoading] = useState(false)
    const [authPage, setAuthPage] = useState(AUTH_PAGES.LOGIN)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [profile, setProfile] = useState(() =>
        loadFromStorage(ADMIN_STORAGE_KEYS.profile, DEFAULT_ADMIN_PROFILE)
    )
    const [preferences, setPreferences] = useState(() => {
        const storedValue = loadFromStorage(ADMIN_STORAGE_KEYS.preferences, DEFAULT_PREFERENCES)
        return {
            ...storedValue,
            displayName: storedValue.displayName || profile.fullName,
            department: storedValue.department || profile.department,
        }
    })
    const [notifications, setNotifications] = useState(() =>
        loadFromStorage(ADMIN_STORAGE_KEYS.notifications, DEFAULT_NOTIFICATIONS)
    )
    const [activityLog, setActivityLog] = useState(() =>
        loadFromStorage(ADMIN_STORAGE_KEYS.activity, [])
    )
    const [rememberedEmail, setRememberedEmail] = useState(() =>
        loadFromStorage(ADMIN_STORAGE_KEYS.rememberEmail, '')
    )
    const [selectedUserProfile, setSelectedUserProfile] = useState(null)
    const [selectedReport, setSelectedReport] = useState(null)
    const [reportStatusMap, setReportStatusMap] = useState({})

    useEffect(() => {
        saveToStorage(ADMIN_STORAGE_KEYS.profile, profile)
    }, [profile])

    useEffect(() => {
        saveToStorage(ADMIN_STORAGE_KEYS.preferences, preferences)
    }, [preferences])

    useEffect(() => {
        saveToStorage(ADMIN_STORAGE_KEYS.notifications, notifications)
    }, [notifications])

    useEffect(() => {
        saveToStorage(ADMIN_STORAGE_KEYS.activity, activityLog)
    }, [activityLog])

    useEffect(() => {
        saveToStorage(ADMIN_STORAGE_KEYS.rememberEmail, rememberedEmail)
    }, [rememberedEmail])

    useEffect(() => {
        if (!isAuthenticated || !isPageLoading) {
            return undefined
        }

        const loadingTimer = window.setTimeout(() => {
            setIsPageLoading(false)
        }, 420)

        return () => window.clearTimeout(loadingTimer)
    }, [activePage, isAuthenticated, isPageLoading])

    function addActivity(action, detail) {
        setActivityLog((previous) => [createActivityEntry(action, detail), ...previous].slice(0, 25))
    }

    function handleRegister(payload) {
        const registrationState = buildRegistrationState({
            currentProfile: profile,
            payload,
        })

        setProfile(registrationState.nextProfile)
        setPreferences((previous) => ({
            ...previous,
            ...registrationState.nextPreferencesPatch,
        }))
        setAuthPage(buildPostRegistrationTransition().nextAuthPage)
        setRememberedEmail(registrationState.rememberedEmail)
        addActivity(registrationState.activity.action, registrationState.activity.detail)

        notifySuccess('Registration successful. You can now sign in.')
        return { ok: true, message: 'Registration complete. You can now sign in.' }
    }

    function handleLogin(payload) {
        const loginValidation = validateLoginCredentials({ profile, payload })

        if (!loginValidation.ok) {
            notifyError(loginValidation.title, loginValidation.message)
            return {
                ok: false,
                message: loginValidation.resultMessage,
            }
        }

        const loginState = buildLoginState({ payload })
        const transition = buildPostLoginTransition({ nextActivePage: loginState.nextActivePage })

        setProfile((previous) => ({ ...previous, lastLoginAt: loginState.loginAt }))
        setIsAuthenticated(transition.isAuthenticated)
        setActivePage(transition.nextActivePage)
        addActivity(loginState.activity.action, loginState.activity.detail)
        setRememberedEmail(loginState.rememberedEmail)

        notifySuccess('Login successful. Welcome back.')
        return { ok: true, message: 'Welcome back. Redirecting to dashboard.' }
    }

    function handleLogout() {
        const transition = buildPostLogoutTransition()
        setIsAuthenticated(transition.isAuthenticated)
        setAuthPage(transition.nextAuthPage)
        addActivity('Logout', 'Signed out from admin workspace')
        notifySuccess('Logout successful.')
    }

    function handleProfileUpdate(updates) {
        const profileUpdateState = buildProfileUpdateState({
            currentPreferences: preferences,
            updates,
        })

        setProfile((previous) => ({ ...previous, ...updates }))

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

    function handleToggleNotification(notificationId) {
        setNotifications((previous) =>
            toggleNotificationReadState({ notifications: previous, notificationId })
        )
    }

    function handleClearNotifications() {
        const transition = buildClearNotificationsTransition()
        setNotifications(transition.nextNotifications)
        addActivity(transition.activity.action, transition.activity.detail)
        notifySuccess(transition.successMessage)
    }

    function handleNavigate(nextPage) {
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

    const unreadNotifications = countUnreadNotifications(notifications)

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
                        onUpdateProfile: handleProfileUpdate,
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
                    })
                )}
            </Navbar>
        </>
    )
}

export default App
