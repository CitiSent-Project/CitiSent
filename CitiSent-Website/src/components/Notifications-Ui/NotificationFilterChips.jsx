import React from 'react'

const filters = ['All', 'Unread', 'Read']

export function NotificationFilterChips({
  activeFilter,
  onFilterChange,
  counts = { all: 0, unread: 0, read: 0 },
  disabled = false,
}) {
  const getBadgeCount = (filter) => {
    if (filter === 'Unread') return counts.unread
    if (filter === 'Read') return counts.read
    return counts.all
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => {
        const isActive = activeFilter === filter
        const count = getBadgeCount(filter)

        return (
          <button
            key={filter}
            type="button"
            disabled={disabled}
            onClick={() => onFilterChange(filter)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed ${
              isActive
                ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/20'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span>{filter}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
