import { FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi'

const statusStyles = {
  Active:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ',
  Pending:
    'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 ',
  Banned:
    'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 ',
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
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${statusStyles[label]}`}
    >
      <Icon className="text-[14px]" />
      {label}
    </span>
  )
}
