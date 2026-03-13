import { FiChevronDown, FiPlus, FiSearch, FiSliders } from 'react-icons/fi'

function ToolbarDropdown({ label, value, options, onChange }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
      <FiSliders className="text-sm" />
      <label className="inline-flex items-center gap-1">
        <span>{label}:</span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="appearance-none bg-transparent pr-5 font-medium text-slate-700 focus:outline-none"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <FiChevronDown className="text-sm" />
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
      <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
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
        className="ml-auto inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
      >
        <FiPlus />
        {primaryAction}
      </button>
    </div>
  )
}
