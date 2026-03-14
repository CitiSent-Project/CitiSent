const filters = ['All', 'Unread', 'Read']

export function NotificationFilterChips({ activeFilter, onFilterChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter}
          type="button"
          onClick={() => onFilterChange(filter)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            activeFilter === filter
              ? 'bg-slate-900 text-white'
              : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  )
}
