import { FiCheckCircle, FiXCircle } from 'react-icons/fi'

const statusStyles = {
  Verified: 'bg-blue-100 text-blue-700 border-blue-200',
  Unverified: 'bg-rose-100 text-rose-700 border-rose-200',
  Banned: 'bg-slate-200 text-slate-700 border-slate-300',
}

export function UserStatusPill({ status }) {
  const isVerified = status === 'Verified'
  const Icon = isVerified ? FiCheckCircle : FiXCircle

  return (
    <span
      className={`inline-flex justify-items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
        statusStyles[status]
      }`}
    >
      <Icon className="text-sm" />
      {status}
    </span>
  )
}
