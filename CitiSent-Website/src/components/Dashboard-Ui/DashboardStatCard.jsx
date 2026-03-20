import { motion } from 'framer-motion'
import { FiTrendingDown, FiTrendingUp } from 'react-icons/fi'

const MotionDiv = motion.div

export function DashboardStatCard({
  icon: Icon,
  label,
  value,
  trendValue,
  trendDirection,
  color = 'blue',
}) {
  const isPositive = trendDirection === 'up'
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
  }

  return (
    <MotionDiv
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 font-numeric text-2xl font-bold text-slate-900">{value}</p>
          <div className="mt-2 flex items-center gap-1">
            {isPositive ? (
              <FiTrendingUp className="text-xs text-green-600" />
            ) : (
              <FiTrendingDown className="text-xs text-red-600" />
            )}
            <span
              className={`font-numeric text-xs font-semibold ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trendValue}
            </span>
          </div>
        </div>
        <div className={`rounded-full p-3 ${colorClasses[color]}`}>
          {Icon ? <Icon className="text-lg" /> : null}
        </div>
      </div>
    </MotionDiv>
  )
}
