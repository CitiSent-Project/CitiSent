import { FiSearch, FiSliders } from 'react-icons/fi';
import { DropdownButton } from '../ui/DropdownButton';

export function UrgencyFilterChips({ 
  chips, 
  selectedChip, 
  onSelectChip,
  searchTerm,
  onSearchChange,
  statusFilter,
  statusOptions = ['All Status', 'Pending', 'In Progress', 'Resolved', 'Unresolved'],
  onStatusChange
}) {
  const normalizedStatusOptions = statusOptions.map((option) => ({
    label: option,
    value: option === 'All Status' ? '' : option,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="flex flex-1 min-w-50 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 focus-within:border-blue-400 transition-colors">
          <FiSearch className="text-slate-400" />
          <input
            className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            placeholder="Search reports by ID, user, or issue..."
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
          className="min-w-52"
        />
      </div>

      {/* Urgency Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Urgency:</span>
        {chips.map((chip) => (
          <button
            type="button"
            key={chip}
            onClick={() => onSelectChip(chip)}
            className={`inline-flex rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
              selectedChip === chip
                ? "bg-blue-700 text-white shadow-sm ring-2 ring-blue-100"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
