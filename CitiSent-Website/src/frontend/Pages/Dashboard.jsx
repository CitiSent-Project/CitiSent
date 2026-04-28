/* eslint-disable react-hooks/preserve-manual-memoization */
import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FiCheckCircle, FiFileText, FiTarget, FiUsers } from 'react-icons/fi'
import {
    DashboardStatCard,
    DashboardTableCard,
    PieChart,
    VerticalChart,
} from '../../components/Dashboard-Ui'
import { ADMIN_STORAGE_KEYS } from '../../models/data'
import { buildDashboardStatCards } from '../../controllers/dashboardController'
import {
    mapDashboardCategoryBreakdown,
    mapDashboardRecentAdmins,
    mapDashboardRecentUsers,
    mapDashboardSummaryToStatCards,
    mapDashboardWeeklyTrend,
} from '../../services/api/admin/dashboardApiMappers'
import { dashboardApiService } from '../../services/api/admin/dashboardApiService'
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
const DASHBOARD_NEW_USERS_TABLE_COLUMNS = ['Username', 'Date Joined']

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

export function Dashboard() {
    const accessToken = useMemo(() => getStoredAccessToken(), [])

    const dashboardQuery = useQuery({
        queryKey: ['dashboard-overview', accessToken],
        enabled: Boolean(accessToken),
        queryFn: async () => {
            const [summaryResponse, categoryResponse, weeklyResponse, adminsResponse, usersResponse] =
                await Promise.all([
                    dashboardApiService.getDashboardSummary(accessToken),
                    dashboardApiService.getDashboardReportsByCategory(accessToken),
                    dashboardApiService.getDashboardWeeklyTrend(accessToken),
                    dashboardApiService.getDashboardRecentAdmins(accessToken, { limit: 5 }),
                    dashboardApiService.getDashboardRecentUsers(accessToken, { limit: 5 }),
                ])

            return {
                summary: summaryResponse?.data,
                category: categoryResponse?.data,
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

    useEffect(() => {
        if (dashboardQuery.error) {
            notifyErrorWithRetry(
                'Unable to load dashboard.',
                dashboardQuery.error.message,
                () => dashboardQuery.refetch()
            )
        }
    }, [dashboardQuery, dashboardQuery.error])

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

        return mapDashboardCategoryBreakdown(dashboardQuery.data.category, DASHBOARD_CATEGORY_COLORS)
    }, [dashboardQuery.data?.category])

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

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <MotionDiv
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-slate-900">
                    Hi, Welcome back<span className="text-3xl">👋</span>
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                    {isLoadingDashboard ? 'Refreshing dashboard metrics...' : 'Dashboard metrics are up to date.'}
                </p>
            </MotionDiv>

            {/* Stats Grid */}
            <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((card) => (
                    <DashboardStatCard key={card.id} {...card} />
                ))}
            </div>

            {/* Charts Grid */}
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="lg:col-span-5 h-125">
                    <PieChart
                        title={categoryData.title}
                        total={categoryData.total}
                        labels={categoryData.labels}
                        values={categoryData.values}
                        colors={categoryData.colors}
                        legend={categoryData.legend}
                    />
                </div>
                <div className="lg:col-span-7 h-125">
                    <VerticalChart
                        title={weeklyData.title}
                        labels={weeklyData.labels}
                        values={weeklyData.values}
                    />
                </div>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <DashboardTableCard
                    title="Admins"
                    columns={adminsTableColumns}
                    rows={adminsTableRowsNoEmail}
                />
                <DashboardTableCard
                    title="Newly Joined Users"
                    columns={DASHBOARD_NEW_USERS_TABLE_COLUMNS}
                    rows={newUsersTableRows}
                />
            </div>
        </div>
    )
}
