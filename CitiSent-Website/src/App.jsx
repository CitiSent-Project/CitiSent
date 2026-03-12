import { useEffect, useState } from 'react'
import { Navbar } from './components/Navbar'
import { Dashboard } from './frontend/Dashboard'
import { Users } from './frontend/Users/Users'
import { UserProfilePage } from './frontend/Users/UserProfilePage/UserProfilePage'
import { Reports } from './frontend/Reports/Reports'
import { LoginPage } from './frontend/Login-Page'
import { RegisterPage } from './frontend/Register-Page'
import { Notifications } from './frontend/Notifications'
import { Logout } from './frontend/Logout'
import { ProfileInformation } from './frontend/ProfilePage'
import { Settings } from './frontend/Settings'
import { PageSkeleton } from './components/ui/PageSkeleton'
import Toasters, { notifyError, notifySuccess } from './components/ui/Toasters'
import {
    ADMIN_STORAGE_KEYS,
    createActivityEntry,
    DEFAULT_ADMIN_PROFILE,
    DEFAULT_NOTIFICATIONS,
    DEFAULT_PREFERENCES,
    loadFromStorage,
    saveToStorage,
} from './frontend/Data/adminPortalData'

function App() {
    const [activePage, setActivePage] = useState('Dashboard')
    const [isPageLoading, setIsPageLoading] = useState(false)
    const [authPage, setAuthPage] = useState('Login')
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
        const now = new Date().toISOString()
        const nextProfile = {
            ...profile,
            ...payload,
            joinedAt: now,
            lastLoginAt: '',
        }

        setProfile(nextProfile)
        setPreferences((previous) => ({
            ...previous,
            displayName: payload.fullName,
            department: payload.department,
        }))
        setAuthPage('Login')
        setRememberedEmail(payload.email)
        addActivity('Registration', `Admin account created for ${payload.email}`)

        notifySuccess('Registration successful. You can now sign in.')
        return { ok: true, message: 'Registration complete. You can now sign in.' }
    }

    function handleLogin(payload) {
        if (payload.email !== profile.email || payload.password !== profile.password) {
            notifyError(
                'Login failed.',
                'Use the registered admin email and password. Check for typing errors and try again.'
            )
            return {
                ok: false,
                message: 'Invalid credentials. Use the registered admin email and password.',
            }
        }

        const loginAt = new Date().toISOString()
        setProfile((previous) => ({ ...previous, lastLoginAt: loginAt }))
        setIsAuthenticated(true)
        setActivePage('Dashboard')
        addActivity('Login', `Signed in as ${payload.email}`)

        if (payload.rememberMe) {
            setRememberedEmail(payload.email)
        } else {
            setRememberedEmail('')
        }

        notifySuccess('Login successful. Welcome back.')
        return { ok: true, message: 'Welcome back. Redirecting to dashboard.' }
    }

    function handleLogout() {
        setIsAuthenticated(false)
        setAuthPage('Login')
        addActivity('Logout', 'Signed out from admin workspace')
        notifySuccess('Logout successful.')
    }

    function handleProfileUpdate(updates) {
        setProfile((previous) => ({ ...previous, ...updates }))

        if (updates.fullName || updates.department) {
            setPreferences((previous) => ({
                ...previous,
                displayName: updates.fullName || previous.displayName,
                department: updates.department || previous.department,
            }))
        }

        addActivity('Profile update', 'Updated admin profile information')
        notifySuccess('Profile updated successfully.')
    }

    function handlePreferenceUpdate(updates) {
        setPreferences((previous) => ({ ...previous, ...updates }))
        addActivity('Settings update', 'Updated account preferences')
        notifySuccess('Settings updated successfully.')
    }

    function handleToggleNotification(notificationId) {
        setNotifications((previous) =>
            previous.map((notification) =>
                notification.id === notificationId
                    ? { ...notification, read: !notification.read }
                    : notification
            )
        )
    }

    function handleClearNotifications() {
        setNotifications([])
        addActivity('Notification cleanup', 'Cleared all notifications')
        notifySuccess('All notifications were cleared.')
    }

    function handleNavigate(nextPage) {
        if (nextPage === activePage) {
            return
        }

        setIsPageLoading(true)
        setActivePage(nextPage)
    }

    const unreadNotifications = notifications.filter((notification) => !notification.read).length

    const renderAuthPage = () => {
        if (authPage === 'Register') {
            return (
                <RegisterPage
                    onRegister={handleRegister}
                    onSwitchToLogin={() => setAuthPage('Login')}
                />
            )
        }

        return (
            <LoginPage
                onLogin={handleLogin}
                onSwitchToRegister={() => setAuthPage('Register')}
                rememberedEmail={rememberedEmail}
            />
        )
    }

    const renderPage = () => {
        switch (activePage) {
            case 'Dashboard':
                return <Dashboard />
            case 'Users':
                return (
                    <Users
                        onViewUserProfile={(user) => {
                            setSelectedUserProfile(user)
                            setActivePage('User Profile')
                        }}
                    />
                )
            case 'Reports':
                return <Reports section="category" />
            case 'Reports:By Category':
                return <Reports section="category" />
            case 'Reports:By Urgency Levels':
                return <Reports section="urgency" />
            case 'Admin Profile':
                return (
                    <ProfileInformation
                        profile={profile}
                        activityLog={activityLog}
                        onUpdateProfile={handleProfileUpdate}
                    />
                )
            case 'Notifications':
                return (
                    <Notifications
                        notifications={notifications}
                        onToggleRead={handleToggleNotification}
                        onClearAll={handleClearNotifications}
                    />
                )
            case 'Settings':
                return (
                    <Settings
                        profile={profile}
                        preferences={preferences}
                        onUpdateProfile={handleProfileUpdate}
                        onUpdatePreferences={handlePreferenceUpdate}
                        onRequestLogout={() => setActivePage('Logout')}
                    />
                )
            case 'Logout':
                return (
                    <Logout
                        onConfirmLogout={handleLogout}
                        onCancel={() => setActivePage('Dashboard')}
                    />
                )
            case 'User Profile':
                return (
                    <UserProfilePage
                        user={selectedUserProfile}
                        onBackToUsers={() => setActivePage('Users')}
                    />
                )
            default:
                return <Dashboard />
        }
    }

    if (!isAuthenticated) {
        return (
            <>
                <Toasters />
                {renderAuthPage()}
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
                {isPageLoading ? <PageSkeleton pageKey={activePage} /> : renderPage()}
            </Navbar>
        </>
    )
}

export default App
