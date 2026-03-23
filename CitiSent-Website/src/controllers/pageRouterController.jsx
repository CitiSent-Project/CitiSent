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
import { ReportDetailPage } from '../components/Reports-Ui/ReportDetailPage'
import { AdminManagement } from '../frontend/AdminManagement'
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
    appState,
    appActions,
}) {
    const {
        activePage,
        profile,
        activityLog,
        adminAccounts,
        notificationsByAdmin,
        notifications,
        preferences,
        selectedUserProfile,
        selectedReport,
        transferRequests,
    } = appState

    const {
        onViewUserProfile,
        onViewReport,
        onUpdateProfile,
        onToggleRead,
        onClearAll,
        onUpdatePreferences,
        onRequestLogout,
        onConfirmLogout,
        onCancelLogout,
        onBackToUsers,
        onBackToReports,
        onUpdateReportStatus,
        onSubmitTransferRequest,
        onAssignOfficeDepartment,
        onApproveTransfer,
        onRejectTransfer,
    } = appActions

    switch (activePage) {
        case APP_PAGES.DASHBOARD:
            return <Dashboard />
        case APP_PAGES.ADMIN_MANAGEMENT:
            return (
                <AdminManagement
                    profile={profile}
                    adminAccounts={adminAccounts}
                    notificationsByAdmin={notificationsByAdmin}
                    transferRequests={transferRequests}
                    onAssignOfficeDepartment={onAssignOfficeDepartment}
                    onApproveTransfer={onApproveTransfer}
                    onRejectTransfer={onRejectTransfer}
                />
            )
        case APP_PAGES.USERS:
            return <Users onViewUserProfile={onViewUserProfile} />
        case APP_PAGES.REPORTS:
            return (
                <Reports
                    section={REPORT_SECTIONS.CATEGORY}
                    profile={profile}
                    onViewReport={onViewReport}
                    onUpdateStatus={onUpdateReportStatus}
                />
            )
        case APP_PAGES.REPORTS_BY_CATEGORY:
            return (
                <Reports
                    section={REPORT_SECTIONS.CATEGORY}
                    profile={profile}
                    onViewReport={onViewReport}
                    onUpdateStatus={onUpdateReportStatus}
                />
            )
        case APP_PAGES.REPORTS_BY_URGENCY:
            return (
                <Reports
                    section={REPORT_SECTIONS.URGENCY}
                    profile={profile}
                    onViewReport={onViewReport}
                    onUpdateStatus={onUpdateReportStatus}
                />
            )
        case APP_PAGES.ADMIN_PROFILE:
            return (
                <ProfileInformation
                    profile={profile}
                    activityLog={activityLog}
                    transferRequests={transferRequests}
                    onUpdateProfile={onUpdateProfile}
                    onSubmitTransferRequest={onSubmitTransferRequest}
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
                    transferRequests={transferRequests}
                    onUpdateProfile={onUpdateProfile}
                    onUpdatePreferences={onUpdatePreferences}
                    onRequestLogout={onRequestLogout}
                    onSubmitTransferRequest={onSubmitTransferRequest}
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
                    profile={profile}
                    onBackToReports={onBackToReports}
                    onUpdateStatus={onUpdateReportStatus}
                />
            )
        default:
            return <Dashboard />
    }
}
