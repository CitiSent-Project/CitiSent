import { lazy } from 'react'
import { Dashboard } from '../../frontend/Pages/Dashboard'
import { Users } from '../../frontend/Users/Users'
import { LoginPage } from '../../frontend/Pages/Login-Page'
import { Logout } from '../../frontend/Pages/Logout'
import { APP_PAGES, REPORT_SECTIONS } from '../../models/pageModel'

// Low-frequency pages are split into separate chunks. The named-export
// adapters keep existing component modules unchanged while allowing Vite to
// load each page only when it is first visited.
const Reports = lazy(() => import('../../frontend/Reports/Reports').then((module) => ({ default: module.Reports })))
const ProfileInformation = lazy(() => import('../../frontend/Pages/ProfilePage').then((module) => ({ default: module.ProfileInformation })))
const Settings = lazy(() => import('../../frontend/Pages/Settings').then((module) => ({ default: module.Settings })))
const UserProfilePage = lazy(() => import('../../frontend/Users/UserProfilePage/UserProfilePage').then((module) => ({ default: module.UserProfilePage })))
const ReportDetailPage = lazy(() => import('../../components/Reports-Ui/ReportDetailPage').then((module) => ({ default: module.ReportDetailPage })))
const AdminManagement = lazy(() => import('../../frontend/Pages/AdminManagement').then((module) => ({ default: module.AdminManagement })))
const ConversationsPage = lazy(() => import('../../frontend/Conversations/ConversationsPage').then((module) => ({ default: module.ConversationsPage })))

export function renderAuthPage({
    onLogin,
    onForgotPassword,
    rememberedEmail,
}) {
    return (
        <LoginPage
            onLogin={onLogin}
            onForgotPassword={onForgotPassword}
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
        onSyncConversations,
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
        case APP_PAGES.REPORTS_HISTORY:
            return (
                <Reports
                    section={REPORT_SECTIONS.HISTORY}
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
        case APP_PAGES.SETTINGS:
            return (
                <Settings
                    profile={profile}
                    accessToken={appState.accessToken}
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
        case APP_PAGES.CONVERSATIONS:
            return <ConversationsPage profile={profile} onViewReport={onViewReport} onSyncConversations={onSyncConversations} />
        default:
            return <Dashboard />
    }
}
