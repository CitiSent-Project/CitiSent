import { FiUser, FiUserX } from 'react-icons/fi'

const accentStyles = {
  indigo: 'bg-indigo-100 text-indigo-700',
  orange: 'bg-orange-100 text-orange-700',
}

export function UserStatCard({ label, value, icon, accent }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className={`rounded-full p-3 ${accentStyles[accent]}`}>
        {icon === 'user' ? <FiUser className="text-xl" /> : <FiUserX className="text-xl" />}
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900 font-numeric">{value}</p>
      </div>
    </div>
  )
}
