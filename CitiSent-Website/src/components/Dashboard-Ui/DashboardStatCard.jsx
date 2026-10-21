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
    blue: 'border border-blue-200/60 bg-blue-50/80 text-blue-600 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-400',
    purple: 'border border-purple-200/60 bg-purple-50/80 text-purple-600 dark:border-purple-900/40 dark:bg-purple-950/30 dark:text-purple-400',
    green: 'border border-emerald-200/60 bg-emerald-50/80 text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400',
    amber: 'border border-amber-200/60 bg-amber-50/80 text-amber-600 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-400',
  }

  return (
    <MotionDiv
      className="rounded-md border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            {label}
          </p>
          <p className="mt-1.5 font-numeric text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            {isPositive ? (
              <FiTrendingUp className="text-xs text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <FiTrendingDown className="text-xs text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span
              className={`font-numeric text-xs font-semibold ${
                isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {trendValue}
            </span>
          </div>
        </div>
        <div className={`grid h-8 w-8 place-content-center rounded-md shrink-0 ${colorClasses[color] || colorClasses.blue}`}>
          {Icon ? <Icon className="text-base" /> : null}
        </div>
      </div>
    </MotionDiv>
  )
}
