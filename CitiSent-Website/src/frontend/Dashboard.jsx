import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FiCheckCircle, FiFileText, FiTarget, FiUsers } from 'react-icons/fi'
import {
    DashboardStatCard,
    DashboardTableCard,
    PieChart,
    VerticalChart,
} from '../components/Dashboard-Ui'
import { ADMIN_STORAGE_KEYS } from '../models/data'
import { buildDashboardStatCards } from '../controllers/dashboardController'
import {
    mapDashboardCategoryBreakdown,
    mapDashboardRecentAdmins,
    mapDashboardRecentUsers,
    mapDashboardSummaryToStatCards,
    mapDashboardWeeklyTrend,
} from '../services/adminApiMappers'
import { adminApiService } from '../services/adminApiService'
import { notifyError } from '../components/ui/toastHelpers'
import { loadFromStorageWithSchema } from '../services/storageService'
import { getStorageSchemaRule } from '../models/storageSchemaModel'

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

    const [statCards, setStatCards] = useState(fallbackStatCards)
    const [categoryData, setCategoryData] = useState(EMPTY_CATEGORY_DATA)
    const [weeklyData, setWeeklyData] = useState(EMPTY_WEEKLY_DATA)
    const [adminsTableRows, setAdminsTableRows] = useState([])
    const [newUsersTableRows, setNewUsersTableRows] = useState([])
    const [isLoadingDashboard, setIsLoadingDashboard] = useState(true)

    useEffect(() => {
        let isCancelled = false

        async function loadDashboard() {
            const token = getStoredAccessToken()
            if (!token) {
                setIsLoadingDashboard(false)
                return
            }

            try {
                setIsLoadingDashboard(true)

                const [summaryResponse, categoryResponse, weeklyResponse, adminsResponse, usersResponse] =
                    await Promise.all([
                        adminApiService.getDashboardSummary(token),
                        adminApiService.getDashboardReportsByCategory(token),
                        adminApiService.getDashboardWeeklyTrend(token),
                        adminApiService.getDashboardRecentAdmins(token, { limit: 5 }),
                        adminApiService.getDashboardRecentUsers(token, { limit: 5 }),
                    ])

                if (isCancelled) {
                    return
                }

                const summaryCards = mapDashboardSummaryToStatCards(
                    summaryResponse?.data,
                    DASHBOARD_STAT_CARDS_TEMPLATE
                )

                setStatCards(buildDashboardStatCards({ statCards: summaryCards, iconMap }))
                setCategoryData(
                    mapDashboardCategoryBreakdown(categoryResponse?.data, DASHBOARD_CATEGORY_COLORS)
                )
                setWeeklyData(mapDashboardWeeklyTrend(weeklyResponse?.data))
                setAdminsTableRows(mapDashboardRecentAdmins(adminsResponse?.data))
                setNewUsersTableRows(mapDashboardRecentUsers(usersResponse?.data))
            } catch (error) {
                if (!isCancelled) {
                    notifyError('Unable to load dashboard.', error.message)
                }
            } finally {
                if (!isCancelled) {
                    setIsLoadingDashboard(false)
                }
            }
        }

        loadDashboard()

        return () => {
            isCancelled = true
        }
    }, [iconMap])

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
                    columns={DASHBOARD_ADMIN_TABLE_COLUMNS}
                    rows={adminsTableRows}
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