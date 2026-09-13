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
    <div className="flex items-center gap-4 sm:gap-6 border-b border-slate-100 dark:border-slate-800 px-4 sm:px-6 overflow-x-auto no-scrollbar">
      {filters.map((filter) => {
        const isActive = activeFilter === filter
        const count = getBadgeCount(filter)

        return (
          <button
            key={filter}
            type="button"
            disabled={disabled}
            onClick={() => onFilterChange(filter)}
            className={`relative flex items-center gap-1.5 sm:gap-2 pb-3 pt-2.5 text-xs sm:text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed shrink-0 ${
              isActive
                ? 'text-slate-900 dark:text-white border-b-2 border-blue-600 dark:border-blue-500 font-semibold'
                : 'text-slate-500 dark:text-slate-400 border-b-2 border-transparent hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>{filter}</span>
            {count > 0 && (
              <span
                className={`flex h-4.5 sm:h-5 min-w-5 px-1.5 items-center justify-center rounded-full text-[10px] font-bold font-numeric transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
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

