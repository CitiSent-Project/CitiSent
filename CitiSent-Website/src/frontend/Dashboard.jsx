/* eslint-disable no-unused-vars */
import { motion } from 'framer-motion'
import { FiTrendingUp, FiTrendingDown, FiUsers, FiFileText, FiCheckCircle, FiTarget } from 'react-icons/fi'
import { PieChart } from '../components/Dashboard-Ui/Pie-Chart'
import { VerticalChart } from '../components/Dashboard-Ui/Vertical-Chart'
import { reportsByCategory, reportsThisWeek } from './Data/dashboardData'
import { getLatestJoinedUsersRows } from './Data/usersData'

const MotionDiv = motion.div

function ProfilePill({ label }) {
    const initials = String(label)
        .trim()
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase())
        .join('')

    return (
        <div className="inline-flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-cyan-100 text-xs font-semibold text-cyan-700">
                {initials || 'U'}
            </span>
            <span>{label}</span>
        </div>
    )
}

function StatCard({ icon: Icon, label, value, trendValue, trendDirection, color = 'blue' }) {
    const isPositive = trendDirection === 'up'
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600',
        green: 'bg-green-50 text-green-600',
        amber: 'bg-amber-50 text-amber-600',
    }

    return (
        <MotionDiv
            className="rounded-lg bg-white p-5 shadow-sm border border-slate-200"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900 font-numeric">{value}</p>
                    <div className="mt-2 flex items-center gap-1">
                        {isPositive ? (
                            <FiTrendingUp className="text-xs text-green-600" />
                        ) : (
                            <FiTrendingDown className="text-xs text-red-600" />
                        )}
                        <span className={`text-xs font-semibold font-numeric ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {trendValue}
                        </span>
                    </div>
                </div>
                <div className={`rounded-full p-3 ${colorClasses[color]}`}>
                    <Icon className="text-lg" />
                </div>
            </div>
        </MotionDiv>
    )
}

function TablePlaceholder({ title, columns, rows }) {
    return (
        <MotionDiv
            className="rounded-lg bg-white shadow-sm border border-slate-200 overflow-hidden"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
        >
            <div className="p-6 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900">{title}</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                            {columns.map((col) => (
                                <th key={col} className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, idx) => (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                {Object.values(row).map((cell, cellIdx) => (
                                    <td
                                        key={cellIdx}
                                        className={`px-6 py-4 text-sm text-slate-700 ${cellIdx !== 0 && /\d/.test(String(cell)) ? 'font-numeric' : ''}`}
                                    >
                                        {cellIdx === 0 ? <ProfilePill label={cell} /> : cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </MotionDiv>
    )
}

export function Dashboard() {
    const statCards = [
        { icon: FiUsers, label: 'Total Users', value: '75.8K', trend: 'up', trendValue: '+12%', trendDirection: 'up', color: 'blue' },
        { icon: FiTarget, label: 'On going reports', value: '75.8K', trend: 'down', trendValue: '-5%', trendDirection: 'down', color: 'purple' },
        { icon: FiCheckCircle, label: 'Reports resolved', value: '75.8K', trend: 'up', trendValue: '+8%', trendDirection: 'up', color: 'green' },
        { icon: FiFileText, label: 'Total Reports', value: '75.8K', trend: 'up', trendValue: '+3%', trendDirection: 'up', color: 'amber' },
    ]

    const adminRows = [
        { name: 'Jiti Chazan', email: 'jitu@example.com', department: 'City Cooperative Development Office', activity: 'Today' },
        { name: 'Tiu Chapman', email: 'jitu@example.com', department: 'Finance, Revenue and Housing Office (DPO)', activity: 'Yesterday' },
        { name: 'Situ Chazan', email: 'jitu@example.com', department: 'Social, Deployment Service Office', activity: '3 March, 2026' },
        { name: 'Amanda Darrell', email: 'amanda@example.com', department: 'City Cooperative Office', activity: '3 March, 2026' },
        { name: 'Amanda Darrell', email: 'amanda@example.com', department: 'City Veterinary Office', activity: '3 March, 2026' },
    ]

    const newUsersRows = getLatestJoinedUsersRows()

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
                    <StatCard key={card.label} {...card} />
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
                <TablePlaceholder
                    title="Admins"
                    columns={['Name', 'Department Assigned', 'Last Activity']}
                    rows={adminRows}
                />
                <TablePlaceholder
                    title="Newly Joined Users"
                    columns={['Username', 'Date Joined']}
                    rows={newUsersRows.map((r) => ({ username: r.username, joined: r.joined }))}
                />
            </div>
        </div>
    )
}