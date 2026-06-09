import { Dashboard } from '../frontend/Pages/Dashboard'
import { Users } from '../frontend/Users/Users'
import { Reports } from '../frontend/Reports/Reports'
import { LoginPage } from '../frontend/Pages/Login-Page'
import { RegisterPage } from '../frontend/Pages/Register-Page'
import { Notifications } from '../frontend/Pages/Notifications'
import { Logout } from '../frontend/Pages/Logout'
import { ProfileInformation } from '../frontend/Pages/ProfilePage'
import { Settings } from '../frontend/Pages/Settings'
import { UserProfilePage } from '../frontend/Users/UserProfilePage/UserProfilePage'
import { ReportDetailPage } from '../components/Reports-Ui/ReportDetailPage'
import { AdminManagement } from '../frontend/Pages/AdminManagement'
import { APP_PAGES, AUTH_PAGES, REPORT_SECTIONS } from '../models/pageModel'

export function renderAuthPage({
    authPage,
    onRegister,
    onSwitchToLogin,
    onLogin,
    onForgotPassword,
    onSwitchToRegister,
    rememberedEmail,
    departmentOptions,
}) {
    if (authPage === AUTH_PAGES.REGISTER) {
        return (
            <RegisterPage
                onRegister={onRegister}
                onSwitchToLogin={onSwitchToLogin}
                departmentOptions={departmentOptions}
            />
        )
    }

    return (
        <LoginPage
            onLogin={onLogin}
            onForgotPassword={onForgotPassword}
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
        departmentOptions,
        departmentCatalog,
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
        onCreateDepartment,
        onUpdateDepartment,
        onSetDepartmentActive,
        onUpdateDepartmentLogo,
        onDeleteDepartmentLogo,
        onDeleteDepartment,
        onApproveTransfer,
        onRejectTransfer,
        onRefreshAdminAccounts,
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
                    onCreateDepartment={onCreateDepartment}
                    onUpdateDepartment={onUpdateDepartment}
                    onSetDepartmentActive={onSetDepartmentActive}
                    onUpdateDepartmentLogo={onUpdateDepartmentLogo}
                    onDeleteDepartmentLogo={onDeleteDepartmentLogo}
                    onDeleteDepartment={onDeleteDepartment}
                    onApproveTransfer={onApproveTransfer}
                    onRejectTransfer={onRejectTransfer}
                    onRefreshAdminAccounts={onRefreshAdminAccounts}
                    departmentOptions={departmentOptions}
                    departmentCatalog={departmentCatalog}
                />
            )
        case APP_PAGES.USERS:
            return (
                <Users
                    onViewUserProfile={onViewUserProfile}
                    profile={profile}
                />
            )
        case APP_PAGES.REPORTS:
            return (
                <Reports
                    section={REPORT_SECTIONS.CATEGORY}
                    profile={profile}
                    preferences={preferences}
                    departmentOptions={departmentOptions}
                    onViewReport={onViewReport}
                    onUpdateStatus={onUpdateReportStatus}
                />
            )
        case APP_PAGES.REPORTS_BY_CATEGORY:
            return (
                <Reports
                    section={REPORT_SECTIONS.CATEGORY}
                    profile={profile}
                    preferences={preferences}
                    departmentOptions={departmentOptions}
                    onViewReport={onViewReport}
                    onUpdateStatus={onUpdateReportStatus}
                />
            )
        case APP_PAGES.REPORTS_BY_URGENCY:
            return (
                <Reports
                    section={REPORT_SECTIONS.URGENCY}
                    profile={profile}
                    preferences={preferences}
                    departmentOptions={departmentOptions}
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
                    onLogout={onConfirmLogout}
                    departmentOptions={departmentOptions}
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
                    preferences={preferences}
                    activityLog={activityLog}
                    onUpdatePreferences={onUpdatePreferences}
                    onRequestLogout={onRequestLogout}
                />
            )
        case APP_PAGES.LOGOUT:
            return <Logout onConfirmLogout={onConfirmLogout} onCancel={onCancelLogout} />
        case APP_PAGES.USER_PROFILE:
            return <UserProfilePage user={selectedUserProfile} onBackToUsers={onBackToUsers} onViewReport={onViewReport} />
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
