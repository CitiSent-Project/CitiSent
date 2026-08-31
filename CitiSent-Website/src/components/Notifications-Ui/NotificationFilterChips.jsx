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
    <div className="flex items-center gap-6 border-b border-slate-200 px-4">
      {filters.map((filter) => {
        const isActive = activeFilter === filter
        const count = getBadgeCount(filter)

        return (
          <button
            key={filter}
            type="button"
            disabled={disabled}
            onClick={() => onFilterChange(filter)}
            className={`relative flex items-center gap-2 pb-3 pt-2 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
              isActive
                ? 'text-slate-900 border-b-2 border-blue-600'
                : 'text-slate-500 border-b-2 border-transparent hover:text-slate-700'
            }`}
          >
            <span>{filter}</span>
            {count > 0 && (
              <span
                className={`flex h-5 items-center justify-center rounded-full px-2 text-[10px] font-bold ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
