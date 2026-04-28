import { FiPlus, FiSearch, FiSliders } from 'react-icons/fi'
import { DropdownButton } from '../ui/DropdownButton'

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
  disableAddUser = false,
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

      <DropdownButton
        label="Sort"
        value={sortBy}
        options={sortOptions}
        onChange={onSortChange}
        icon={FiSliders}
        ariaLabel="Sort users"
      />
      <DropdownButton
        label="Filter"
        value={filterBy}
        options={filterOptions}
        onChange={onFilterChange}
        icon={FiSliders}
        ariaLabel="Filter users"
      />

      <button
        type="button"
        onClick={onAddUserClick}
        disabled={disableAddUser}
        title={disableAddUser ? 'Only superadmins can add users.' : primaryAction}
        className="ml-auto inline-flex items-center gap-2 rounded-lg hover:bg-blue-900 transition duration-300 bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400 disabled:hover:bg-slate-400"
      >
        <FiPlus />
        {primaryAction}
      </button>
    </div>
  )
}
