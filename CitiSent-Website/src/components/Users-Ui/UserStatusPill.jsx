import { FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi'

const statusStyles = {
  Active:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  Pending:
    'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20',
  Banned:
    'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
}

const statusIcons = {
  Active: FiCheckCircle,
  Pending: FiClock,
  Banned: FiXCircle,
}

export function UserStatusPill({ status }) {
  const label = statusStyles[status] ? status : 'Active'
  const Icon = statusIcons[label]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide ${statusStyles[label]}`}
    >
      <Icon className="text-[14px]" />
      {label}
    </span>
  )
}
