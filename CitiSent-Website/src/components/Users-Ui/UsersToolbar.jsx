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
    <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between dark:border-slate-700/80">
      <div className="flex flex-1 items-center gap-2 rounded-2xl border border-transparent bg-slate-100 px-4 py-2.5 transition-all focus-within:border-blue-500/50 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 sm:max-w-md dark:bg-slate-800/60 dark:focus-within:border-blue-500/30 dark:focus-within:bg-slate-800">
        <FiSearch className="text-slate-400 dark:text-slate-500" />
        <input
          className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-slate-200 dark:placeholder:text-slate-500"
          placeholder={searchPlaceholder}
          type="text"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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
          whileHover={{ scale: disableAddUser ? 1 : 1.02 }}
          whileTap={{ scale: disableAddUser ? 1 : 0.96 }}
          title={disableAddUser ? 'Only superadmins can add users.' : primaryAction}
          className="w-full sm:w-auto sm:ml-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-all duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-500 cursor-pointer"
        >
          <FiPlus />
          {primaryAction}
        </motion.button>
      </div>
    </div>
  )
}
