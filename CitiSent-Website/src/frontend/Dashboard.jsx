import { motion } from 'framer-motion'
import { FiCheckCircle, FiFileText, FiTarget, FiUsers } from 'react-icons/fi'
import {
    DashboardStatCard,
    DashboardTableCard,
    PieChart,
    VerticalChart,
} from '../components/Dashboard-Ui'
import {
    dashboardAdminRows,
    dashboardAdminTableColumns,
    dashboardNewUsersTableColumns,
    dashboardStatCards,
    getLatestJoinedUsersRows,
    reportsByCategory,
    reportsThisWeek,
} from '../models/data'
import { buildDashboardNewUserRows, buildDashboardStatCards } from '../controllers/dashboardController'

const MotionDiv = motion.div

export function Dashboard() {
    const iconMap = {
        users: FiUsers,
        target: FiTarget,
        'check-circle': FiCheckCircle,
        'file-text': FiFileText,
    }
    const statCards = buildDashboardStatCards({ statCards: dashboardStatCards, iconMap })

    const newUsersRows = getLatestJoinedUsersRows()
    const newUsersTableRows = buildDashboardNewUserRows(newUsersRows)

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
                        title={reportsByCategory.title}
                        total={reportsByCategory.total}
                        labels={reportsByCategory.labels}
                        values={reportsByCategory.values}
                        colors={reportsByCategory.colors}
                        legend={reportsByCategory.legend}
                    />
                </div>
                <div className="lg:col-span-7 h-125">
                    <VerticalChart
                        title={reportsThisWeek.title}
                        labels={reportsThisWeek.labels}
                        values={reportsThisWeek.values}
                    />
                </div>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <DashboardTableCard
                    title="Admins"
                    columns={dashboardAdminTableColumns}
                    rows={dashboardAdminRows}
                />
                <DashboardTableCard
                    title="Newly Joined Users"
                    columns={dashboardNewUsersTableColumns}
                    rows={newUsersTableRows}
                />
            </div>
        </div>
    )
}