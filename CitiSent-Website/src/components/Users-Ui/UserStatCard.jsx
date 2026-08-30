import { FiUser, FiUserX } from 'react-icons/fi'

const accentStyles = {
  blue: 'bg-blue-100/80 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  cyan: 'bg-cyan-100/80 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400',
  orange: 'bg-orange-100/80 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
}

export function UserStatCard({ label, value, icon, accent }) {
  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/90 px-5 py-5 shadow-xs backdrop-blur-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-800/90">
      <div className={`rounded-xl p-3.5 transition-colors duration-300 ${accentStyles[accent] || accentStyles.blue}`}>
        {icon === 'user' ? <FiUser className="text-xl" /> : <FiUserX className="text-xl" />}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="font-numeric text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  )
}
