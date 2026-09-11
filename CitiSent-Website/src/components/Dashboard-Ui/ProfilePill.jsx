export function ProfilePill({ label }) {
  const initials = String(label)
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')

  return (
    <div className="inline-flex items-center gap-2.5 min-w-0">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-100 text-xs sm:text-sm font-semibold text-blue-900 leading-none dark:bg-blue-900/50 dark:text-blue-200">
        {initials || 'U'}
      </span>
      <span className="truncate min-w-0 text-sm font-medium text-slate-800 dark:text-slate-100">{label}</span>
    </div>
  )
}
