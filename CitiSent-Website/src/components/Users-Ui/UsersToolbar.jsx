import { FiPlus, FiSearch, FiSliders } from 'react-icons/fi'
import { motion } from 'framer-motion'
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
    <div className="flex flex-col gap-3 border-b border-slate-200 p-3 sm:px-4 sm:py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between dark:border-slate-800">
      <div className="flex flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 transition-colors focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600/30 sm:max-w-xs dark:border-slate-800 dark:bg-slate-900 dark:focus-within:border-blue-500">
        <FiSearch className="text-slate-400 dark:text-slate-500 text-xs shrink-0" />
        <input
          className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-200 dark:placeholder:text-slate-500"
          placeholder={searchPlaceholder}
          type="text"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
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

        <motion.button
          type="button"
          onClick={onAddUserClick}
          disabled={disableAddUser}
          whileHover={{ scale: disableAddUser ? 1 : 1.01 }}
          whileTap={{ scale: disableAddUser ? 1 : 0.98 }}
          title={disableAddUser ? 'Only superadmins can add users.' : primaryAction}
          className="w-full sm:w-auto sm:ml-auto inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3.5 text-xs font-medium text-white shadow-xs transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none dark:disabled:bg-slate-800 dark:disabled:text-slate-600 cursor-pointer"
        >
          <FiPlus className="text-sm" />
          {primaryAction}
        </motion.button>
      </div>
    </div>
  )
}
