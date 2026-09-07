export function ProfilePill({ label }) {
  const initials = String(label)
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')

  return (
    <div className="inline-flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-100 text-sm font-semibold text-cyan-900 leading-none dark:bg-blue-900/40 dark:text-cyan-200">
        {initials || 'U'}
      </span>
      <span className="truncate text-slate-800 dark:text-slate-100">{label}</span>
    </div>
  )
}
