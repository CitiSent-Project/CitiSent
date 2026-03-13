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
              ? 'border border-blue-900 bg-blue-900 text-white'
              : 'border border-blue-900 bg-white text-blue-900 hover:bg-blue-50'
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  )
}
