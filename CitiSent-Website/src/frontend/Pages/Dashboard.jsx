/* eslint-disable react-hooks/preserve-manual-memoization */
import { useCallback, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FiCheckCircle, FiDownload, FiFileText, FiTarget, FiUsers } from 'react-icons/fi'
import {
    DashboardStatCard,
    DashboardTableCard,
    ExportCsvButton,
    PieChart,
    SolidPieChart,
    VerticalChart,
} from '../../components/Dashboard-Ui'
import { ADMIN_STORAGE_KEYS } from '../../models/data'
import { buildDashboardStatCards } from '../../controllers/admin/dashboardController'
import {
    mapDashboardCategoryBreakdown,
    mapDashboardStatusBreakdown,
    mapDashboardRecentAdmins,
    mapDashboardRecentUsers,
    mapDashboardSummaryToStatCards,
    mapDashboardWeeklyTrend,
} from '../../services/api/admin/dashboardApiMappers'
import { dashboardApiService } from '../../services/api/admin/dashboardApiService'
import { exportToCsv } from '../../services/csvExportService'
import {
    formatCategoryCsv,
    formatStatusBreakdownCsv,
    formatWeeklyTrendCsv,
    formatSummaryCsv,
    formatRecentAdminsCsv,
    formatRecentUsersCsv,
    formatAllDashboardCsv,
} from '../../services/api/admin/dashboardCsvFormatters'
import { notifyErrorWithRetry } from '../../components/ui/toastHelpers'
import { loadFromStorageWithSchema } from '../../services/storageService'
import { getStorageSchemaRule } from '../../models/storageSchemaModel'

const MotionDiv = motion.div

const DASHBOARD_STAT_CARDS_TEMPLATE = [
    {
        id: 'total-users',
        iconKey: 'users',
        label: 'Total Users',
        value: '0',
        trendValue: '--',
        trendDirection: 'up',
        color: 'blue',
    },
    {
        id: 'ongoing-reports',
        iconKey: 'target',
        label: 'On going reports',
        value: '0',
        trendValue: '--',
        trendDirection: 'up',
        color: 'purple',
    },
    {
        id: 'reports-resolved',
        iconKey: 'check-circle',
        label: 'Reports resolved',
        value: '0',
        trendValue: '--',
        trendDirection: 'up',
        color: 'green',
    },
    {
        id: 'total-reports',
        iconKey: 'file-text',
        label: 'Total Reports',
        value: '0',
        trendValue: '--',
        trendDirection: 'up',
        color: 'amber',
    },
]

const DASHBOARD_CATEGORY_COLORS = [
    '#1650e8',
    '#65c98d',
    '#8d66d6',
    '#ff9082',
    '#39bee0',
    '#ffb44d',
    '#2f89e5',
    '#7a6ce5',
]

const DASHBOARD_ADMIN_TABLE_COLUMNS = ['Name', 'Email', 'Department Assigned', 'Last Activity']
const DASHBOARD_NEW_USERS_TABLE_COLUMNS = ['Email', 'Date Joined']

const EMPTY_CATEGORY_DATA = {
    title: 'Reports by Category',
    total: '0',
    labels: [],
    values: [],
    colors: [],
    legend: [],
}

const EMPTY_WEEKLY_DATA = {
    title: 'Total Reports This Week',
    labels: [],
    values: [],
}

function getStoredAccessToken() {
    const schemaRule = getStorageSchemaRule(ADMIN_STORAGE_KEYS.accessToken)

    return loadFromStorageWithSchema(ADMIN_STORAGE_KEYS.accessToken, '', {
        schemaVersion: schemaRule.schemaVersion,
        migrate: schemaRule.migrate,
        validate: schemaRule.validate,
    })
}

function getStoredProfile() {
    const schemaRule = getStorageSchemaRule(ADMIN_STORAGE_KEYS.profile)

    return loadFromStorageWithSchema(ADMIN_STORAGE_KEYS.profile, null, {
        schemaVersion: schemaRule.schemaVersion,
        migrate: schemaRule.migrate,
        validate: schemaRule.validate,
    })
}

export function Dashboard({ profile: propsProfile }) {
    const accessToken = useMemo(() => getStoredAccessToken(), [])
    const profile = useMemo(() => propsProfile || getStoredProfile(), [propsProfile])

    const dashboardQuery = useQuery({
        queryKey: ['dashboard-overview', accessToken],
        enabled: Boolean(accessToken),
        queryFn: async () => {
            const [summaryResponse, categoryResponse, statusResponse, weeklyResponse, adminsResponse, usersResponse] =
                await Promise.all([
                    dashboardApiService.getDashboardSummary(accessToken),
                    dashboardApiService.getDashboardReportsByCategory(accessToken),
                    dashboardApiService.getDashboardReportsByStatus(accessToken),
                    dashboardApiService.getDashboardWeeklyTrend(accessToken),
                    dashboardApiService.getDashboardRecentAdmins(accessToken, { limit: 5 }),
                    dashboardApiService.getDashboardRecentUsers(accessToken, { limit: 5 }),
                ])

            return {
                summary: summaryResponse?.data,
                category: categoryResponse?.data,
                statusBreakdown: statusResponse?.data,
                weekly: weeklyResponse?.data,
                admins: adminsResponse?.data,
                users: usersResponse?.data,
            }
        },
    })

    const iconMap = useMemo(
        () => ({
            users: FiUsers,
            target: FiTarget,
            'check-circle': FiCheckCircle,
            'file-text': FiFileText,
        }),
        []
    )

    const fallbackStatCards = useMemo(
        () => buildDashboardStatCards({ statCards: DASHBOARD_STAT_CARDS_TEMPLATE, iconMap }),
        [iconMap]
    )

    const dashboardQueryError = dashboardQuery.error
    const refetchDashboard = dashboardQuery.refetch

    useEffect(() => {
        if (dashboardQueryError) {
            notifyErrorWithRetry(
                'Unable to load dashboard.',
                dashboardQueryError.message,
                () => refetchDashboard()
            )
        }
    }, [dashboardQueryError, refetchDashboard])

    const isLoadingDashboard = Boolean(accessToken) && (dashboardQuery.isLoading || dashboardQuery.isFetching)

    const statCards = useMemo(() => {
        if (!dashboardQuery.data?.summary) {
            return fallbackStatCards
        }

        const summaryCards = mapDashboardSummaryToStatCards(
            dashboardQuery.data.summary,
            DASHBOARD_STAT_CARDS_TEMPLATE
        )

        return buildDashboardStatCards({ statCards: summaryCards, iconMap })
    }, [dashboardQuery.data?.summary, fallbackStatCards, iconMap])

    const categoryData = useMemo(() => {
        if (!dashboardQuery.data?.category) {
            return EMPTY_CATEGORY_DATA
        }

        return mapDashboardCategoryBreakdown(
            dashboardQuery.data.category,
            DASHBOARD_CATEGORY_COLORS,
            profile
        )
    }, [dashboardQuery.data?.category, profile])

    const statusData = useMemo(() => {
        if (!dashboardQuery.data?.statusBreakdown) {
            return EMPTY_CATEGORY_DATA // Has same shape (title, total, labels, etc.)
        }

        return mapDashboardStatusBreakdown(dashboardQuery.data.statusBreakdown)
    }, [dashboardQuery.data?.statusBreakdown])

    const weeklyData = useMemo(() => {
        if (!dashboardQuery.data?.weekly) {
            return EMPTY_WEEKLY_DATA
        }

        return mapDashboardWeeklyTrend(dashboardQuery.data.weekly)
    }, [dashboardQuery.data?.weekly])

    const adminsTableRows = useMemo(
        () => mapDashboardRecentAdmins(dashboardQuery.data?.admins || []),
        [dashboardQuery.data?.admins]
    )

    // Remove email column for admins view and strip email from each row
    const adminsTableColumns = useMemo(() => DASHBOARD_ADMIN_TABLE_COLUMNS.filter((c) => c !== 'Email'), []);

    const adminsTableRowsNoEmail = useMemo(
        () =>
            adminsTableRows.map((row) => {
                // create shallow copy and remove common email keys if present
                const newRow = { ...row };
                delete newRow.email;
                delete newRow.Email;
                return newRow;
            }),
        [adminsTableRows]
    );

    const newUsersTableRows = useMemo(
        () => mapDashboardRecentUsers(dashboardQuery.data?.users || []),
        [dashboardQuery.data?.users]
    )

    // --- CSV Export Handlers ---
    // Privacy: admin/user exports use RAW API data, never the mapped rows that contain names.

    const handleExportCategory = useCallback(() => {
        exportToCsv(formatCategoryCsv(categoryData))
    }, [categoryData])

    const handleExportStatus = useCallback(() => {
        exportToCsv(formatStatusBreakdownCsv(statusData))
    }, [statusData])

    const handleExportWeekly = useCallback(() => {
        exportToCsv(formatWeeklyTrendCsv(weeklyData))
    }, [weeklyData])

    const handleExportSummary = useCallback(() => {
        exportToCsv(formatSummaryCsv(statCards))
    }, [statCards])

    const handleExportAdmins = useCallback(() => {
        exportToCsv(formatRecentAdminsCsv(dashboardQuery.data?.admins || []))
    }, [dashboardQuery.data?.admins])

    const handleExportUsers = useCallback(() => {
        exportToCsv(formatRecentUsersCsv(dashboardQuery.data?.users || []))
    }, [dashboardQuery.data?.users])

    const handleExportAll = useCallback(() => {
        exportToCsv(formatAllDashboardCsv({
            categoryData,
            statusData,
            weeklyData,
            statCards,
            adminsRaw: dashboardQuery.data?.admins || [],
            usersRaw: dashboardQuery.data?.users || [],
        }))
    }, [categoryData, statusData, weeklyData, statCards, dashboardQuery.data?.admins, dashboardQuery.data?.users])

    return (
        <main className="w-full flex-1 min-w-0 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8 dark:bg-slate-900">
            <MotionDiv
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-5 sm:mb-8 flex items-start justify-between gap-4"
            >
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
                        Hi, Welcome back<span className="text-2xl sm:text-3xl">👋</span>
                    </h1>
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        {isLoadingDashboard ? 'Refreshing dashboard metrics...' : 'Dashboard metrics are up to date.'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleExportAll}
                    disabled={isLoadingDashboard || !dashboardQuery.data}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium text-slate-600 shadow-xs transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 hover:shadow-sm active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-white"
                >
                    <FiDownload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Export All</span>
                    <span className="sm:hidden">Export</span>
                </button>
            </MotionDiv>

            {/* Stats Grid */}
            <div className="mb-5 sm:mb-8">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide dark:text-slate-400">Overview</h2>
                    <ExportCsvButton onExport={handleExportSummary} label="Export summary to CSV" disabled={isLoadingDashboard} />
                </div>
                <div className="grid grid-cols-1 gap-3.5 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {statCards.map((card) => (
                        <DashboardStatCard key={card.id} {...card} />
                    ))}
                </div>
            </div>

            {/* Charts Grid */}
            <div className="mb-5 sm:mb-8 grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2">
                <div className="relative h-90 sm:h-100 lg:h-110 min-w-0">
                    <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-10">
                        <ExportCsvButton onExport={handleExportCategory} label="Export categories to CSV" disabled={isLoadingDashboard} />
                    </div>
                    <PieChart
                        title={categoryData.title}
                        total={categoryData.total}
                        labels={categoryData.labels}
                        values={categoryData.values}
                        colors={categoryData.colors}
                        legend={categoryData.legend}
                    />
                </div>
                <div className="relative h-90 sm:h-100 lg:h-110 min-w-0">
                    <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-10">
                        <ExportCsvButton onExport={handleExportStatus} label="Export status breakdown to CSV" disabled={isLoadingDashboard} />
                    </div>
                    <SolidPieChart
                        title={statusData.title}
                        total={statusData.total}
                        labels={statusData.labels}
                        values={statusData.values}
                        colors={statusData.colors}
                        legend={statusData.legend}
                    />
                </div>
            </div>
            <div className="relative mb-5 sm:mb-8 w-full h-90 sm:h-100 lg:h-110 min-w-0">
                <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-10">
                    <ExportCsvButton onExport={handleExportWeekly} label="Export weekly trend to CSV" disabled={isLoadingDashboard} />
                </div>
                <VerticalChart
                    title={weeklyData.title}
                    labels={weeklyData.labels}
                    values={weeklyData.values}
                />
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2">
                <div className="relative">
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
                        <ExportCsvButton onExport={handleExportAdmins} label="Export admins to CSV" disabled={isLoadingDashboard} />
                    </div>
                    <DashboardTableCard
                        title="Admins"
                        columns={adminsTableColumns}
                        rows={adminsTableRowsNoEmail}
                        isLoading={isLoadingDashboard}
                    />
                </div>
                <div className="relative">
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
                        <ExportCsvButton onExport={handleExportUsers} label="Export users to CSV" disabled={isLoadingDashboard} />
                    </div>
                    <DashboardTableCard
                        title="Newly Joined Users"
                        columns={DASHBOARD_NEW_USERS_TABLE_COLUMNS}
                        rows={newUsersTableRows}
                        isLoading={isLoadingDashboard}
                    />
                </div>
            </div>
        </main>
    )
}
