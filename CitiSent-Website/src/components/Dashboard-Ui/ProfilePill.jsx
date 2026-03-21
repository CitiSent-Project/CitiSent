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
      <span className="grid h-8 w-8 place-items-center rounded-full bg-cyan-100 text-xs font-semibold text-cyan-700">
        {initials || 'U'}
      </span>
      <span>{label}</span>
    </div>
  )
}
