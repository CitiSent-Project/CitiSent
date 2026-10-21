import { FiSearch, FiSliders } from 'react-icons/fi';
import { DropdownButton } from '../ui/DropdownButton';

export function UrgencyFilterChips({ 
  chips, 
  selectedChip, 
  onSelectChip,
  searchTerm,
  onSearchChange,
  statusFilter,
  statusOptions = ['All Status', 'Pending', 'In Progress'],
  onStatusChange
}) {
  const normalizedStatusOptions = statusOptions.map((option) => ({
    label: option,
    value: option === 'All Status' ? '' : option,
  }));

  return (
    <div className="flex flex-col gap-3 w-full min-w-0">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full min-w-0">
        {/* Search Input */}
        <div className="flex flex-1 min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600/30 transition-colors dark:border-slate-800 dark:bg-slate-900">
          <FiSearch className="text-slate-400 shrink-0 dark:text-slate-500 text-xs" />
          <input
            className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none min-w-0 dark:text-slate-200 dark:placeholder:text-slate-500"
            placeholder="Search reports by ID, email, location, or date..."
            aria-label="Search reports by ID, email, location, or date"
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <DropdownButton
          value={statusFilter || ''}
          options={normalizedStatusOptions}
          onChange={onStatusChange}
          icon={FiSliders}
          placeholder="All Status"
          ariaLabel="Filter reports by status"
          className="w-full sm:w-auto sm:min-w-44"
        />
      </div>

      {/* Urgency Chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mr-1 dark:text-slate-400">Urgency:</span>
        {chips.map((chip) => (
          <button
            type="button"
            key={chip}
            onClick={() => onSelectChip(chip)}
            className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
              selectedChip === chip
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800"
            }`}
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
