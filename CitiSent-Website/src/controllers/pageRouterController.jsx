import { Dashboard } from '../frontend/Dashboard'
import { Users } from '../frontend/Users/Users'
import { Reports } from '../frontend/Reports/Reports'
import { LoginPage } from '../frontend/Login-Page'
import { RegisterPage } from '../frontend/Register-Page'
import { Notifications } from '../frontend/Notifications'
import { Logout } from '../frontend/Logout'
import { ProfileInformation } from '../frontend/ProfilePage'
import { Settings } from '../frontend/Settings'
import { UserProfilePage } from '../frontend/Users/UserProfilePage/UserProfilePage'
import { ReportDetailPage } from '../frontend/Reports/ReportDetailPage/ReportDetailPage'
import { APP_PAGES, AUTH_PAGES, REPORT_SECTIONS } from '../models/pageModel'

export function renderAuthPage({ authPage, onRegister, onSwitchToLogin, onLogin, onSwitchToRegister, rememberedEmail }) {
    if (authPage === AUTH_PAGES.REGISTER) {
        return <RegisterPage onRegister={onRegister} onSwitchToLogin={onSwitchToLogin} />
    }

    return (
        <LoginPage
            onLogin={onLogin}
            onSwitchToRegister={onSwitchToRegister}
            rememberedEmail={rememberedEmail}
        />
    )
}

export function renderActivePage({
    activePage,
    onViewUserProfile,
    onViewReport,
    profile,
    activityLog,
    onUpdateProfile,
    notifications,
    onToggleRead,
    onClearAll,
    preferences,
    onUpdatePreferences,
    onRequestLogout,
    onConfirmLogout,
    onCancelLogout,
    selectedUserProfile,
    onBackToUsers,
    selectedReport,
    onBackToReports,
    onUpdateReportStatus,
}) {
    switch (activePage) {
        case APP_PAGES.DASHBOARD:
            return <Dashboard />
        case APP_PAGES.USERS:
            return <Users onViewUserProfile={onViewUserProfile} />
        case APP_PAGES.REPORTS:
            return <Reports section={REPORT_SECTIONS.CATEGORY} onViewReport={onViewReport} />
        case APP_PAGES.REPORTS_BY_CATEGORY:
            return <Reports section={REPORT_SECTIONS.CATEGORY} onViewReport={onViewReport} />
        case APP_PAGES.REPORTS_BY_URGENCY:
            return <Reports section={REPORT_SECTIONS.URGENCY} onViewReport={onViewReport} />
        case APP_PAGES.ADMIN_PROFILE:
            return (
                <ProfileInformation
                    profile={profile}
                    activityLog={activityLog}
                    onUpdateProfile={onUpdateProfile}
                />
            )
        case APP_PAGES.NOTIFICATIONS:
            return (
                <Notifications
                    notifications={notifications}
                    onToggleRead={onToggleRead}
                    onClearAll={onClearAll}
                />
            )
        case APP_PAGES.SETTINGS:
            return (
                <Settings
                    profile={profile}
                    preferences={preferences}
                    onUpdateProfile={onUpdateProfile}
                    onUpdatePreferences={onUpdatePreferences}
                    onRequestLogout={onRequestLogout}
                />
            )
        case APP_PAGES.LOGOUT:
            return <Logout onConfirmLogout={onConfirmLogout} onCancel={onCancelLogout} />
        case APP_PAGES.USER_PROFILE:
            return <UserProfilePage user={selectedUserProfile} onBackToUsers={onBackToUsers} />
        case APP_PAGES.REPORT_DETAIL:
            return (
                <ReportDetailPage
                    report={selectedReport}
                    onBackToReports={onBackToReports}
                    onUpdateStatus={onUpdateReportStatus}
                />
            )
        default:
            return <Dashboard />
    }
}
