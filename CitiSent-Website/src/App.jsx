import { useEffect, useState } from 'react'
import { Navbar } from './components/Navbar'
import { PageSkeleton } from './components/ui/PageSkeleton'
import Toasters from './components/ui/Toasters'
import { notifyError, notifySuccess } from './components/ui/toastHelpers'
import {
    ADMIN_STORAGE_KEYS,
    DEFAULT_ADMIN_PROFILE,
    DEFAULT_NOTIFICATIONS,
    DEFAULT_PREFERENCES,
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

function App() {
    const [activePage, setActivePage] = useState(() => {
        const storedPage = loadFromStorage(ADMIN_STORAGE_KEYS.activePage, APP_PAGES.DASHBOARD)
        return Object.values(APP_PAGES).includes(storedPage) ? storedPage : APP_PAGES.DASHBOARD
    })
    const [isPageLoading, setIsPageLoading] = useState(false)
    const [authPage, setAuthPage] = useState(AUTH_PAGES.LOGIN)
    const [isAuthenticated, setIsAuthenticated] = useState(() =>
        loadFromStorage(ADMIN_STORAGE_KEYS.authSession, false)
    )
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

    usePersistToStorage(ADMIN_STORAGE_KEYS.profile, profile)
    usePersistToStorage(ADMIN_STORAGE_KEYS.preferences, preferences)
    usePersistToStorage(ADMIN_STORAGE_KEYS.notifications, notifications)
    usePersistToStorage(ADMIN_STORAGE_KEYS.activity, activityLog)
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
        unreadNotifications,
        handleToggleNotification,
        handleClearNotifications,
    } = useNotificationsState({
        notifications,
        setNotifications,
        addActivity,
        notifySuccess,
    })

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
