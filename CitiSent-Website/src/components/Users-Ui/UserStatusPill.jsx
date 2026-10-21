import { FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi'

const statusStyles = {
  Active:
    'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40',
  Pending:
    'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40',
  Banned:
    'bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40',
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
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium tracking-normal ${statusStyles[label]}`}
    >
      <Icon className="text-xs shrink-0" />
      {label}
    </span>
  )
}
