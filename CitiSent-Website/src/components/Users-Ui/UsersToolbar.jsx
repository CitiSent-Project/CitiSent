import { FiChevronDown, FiPlus, FiSearch, FiSliders } from 'react-icons/fi'

function ToolbarDropdown({ label, value, options, onChange }) {
  return (
    <div className="relative inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
      <FiSliders className="text-sm shrink-0" />
      <div className="flex items-center gap-1 overflow-hidden">
        <span className="whitespace-nowrap">{label}:</span>
        <span className="font-medium text-slate-700 truncate">{value}</span>
      </div>
      <FiChevronDown className="text-sm ml-auto shrink-0" />

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
      >
        {options.map((option) => (
          <option key={option} value={option} className="text-black">
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

export function UsersToolbar({
  searchPlaceholder,
  primaryAction,
  searchTerm,
  sortBy,
  filterBy,
  sortOptions,
  filterOptions,
  onSearchChange,
  onSortChange,
  onFilterChange,
  onAddUserClick,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3">
      <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
        <FiSearch className="text-slate-400" />
        <input
          className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          placeholder={searchPlaceholder}
          type="text"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <ToolbarDropdown
        label="Sort"
        value={sortBy}
        options={sortOptions}
        onChange={onSortChange}
      />
      <ToolbarDropdown
        label="Filter"
        value={filterBy}
        options={filterOptions}
        onChange={onFilterChange}
      />

      <button
        type="button"
        onClick={onAddUserClick}
        className="ml-auto inline-flex items-center gap-2 rounded-lg hover:bg-blue-900 transition duration-300 bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
      >
        <FiPlus />
        {primaryAction}
      </button>
    </div>
  )
}
