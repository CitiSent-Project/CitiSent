const urgencyBadgeStyles = {
  Emergency: 'bg-rose-100 text-rose-700',
  Urgent: 'bg-orange-100 text-orange-700',
  Moderate: 'bg-lime-100 text-lime-700',
  'Low Priority': 'bg-green-100 text-green-700',
  Calm: 'bg-blue-100 text-blue-700',
}

function ReporterAvatar({ name }) {
  const initials = String(name)
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')

  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cyan-100 text-xs font-semibold text-cyan-700">
      {initials || 'U'}
    </span>
  )
}

export function UrgencyFeedTable({ rows }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-[1.2fr_1.2fr_0.6fr] border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span>Reporter</span>
        <span>Report Details</span>
        <span>Labeled As</span>
      </div>

      <div className="divide-y divide-slate-200">
        {rows.length ? (
          rows.map((row) => (
            <article key={row.id} className="grid grid-cols-[1.2fr_1.2fr_0.6fr] gap-4 px-5 py-4">
              <div className="flex items-start gap-3">
                <ReporterAvatar name={row.name} />

                <div>
                  <p className="text-sm font-semibold text-slate-900">{row.name}</p>
                  <p className="text-xs text-slate-500">{row.location}</p>
                  <p className="text-xs text-slate-500">{row.email}</p>
                  <p className="text-xs text-slate-400">{row.date}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-slate-700">{row.message}</p>
                <p className="text-xs text-slate-500">Category: {row.category}</p>
                <p className="text-xs text-slate-500">Source: {row.source}</p>
              </div>

              <div className="space-y-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    urgencyBadgeStyles[row.urgency] ?? 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {row.urgency}
                </span>
                <p className="text-xs text-slate-500">Ref: {row.id}</p>
              </div>
            </article>
          ))
        ) : (
          <div className="px-5 py-8 text-center text-sm text-slate-500">No reports found for this urgency.</div>
        )}
      </div>
    </div>
  )
}
