import { FiCheckCircle, FiXCircle } from 'react-icons/fi'

const statusStyles = {
  Active: 'bg-blue-100 text-blue-700 border-blue-200',
  Banned: 'bg-slate-200 text-slate-700 border-slate-300',
}

export function UserStatusPill({ status }) {
  const isActive = status === 'Active'
  const Icon = isActive ? FiCheckCircle : FiXCircle
  const label = statusStyles[status] ? status : 'Active'

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
