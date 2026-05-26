import { FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi'

const statusStyles = {
  Active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Pending: 'bg-slate-100 text-slate-600 border-slate-200',
  Banned: 'bg-slate-200 text-slate-700 border-slate-300',
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
      className={`inline-flex justify-items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
        statusStyles[label]
      }`}
    >
      <Icon className="text-sm" />
      {label}
    </span>
  )
}
