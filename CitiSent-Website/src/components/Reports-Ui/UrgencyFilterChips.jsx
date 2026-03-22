import { FiSearch, FiSliders, FiChevronDown } from 'react-icons/fi';

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
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 focus-within:border-blue-400 transition-colors">
          <FiSearch className="text-slate-400" />
          <input
            className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            placeholder="Search reports by ID, user, or issue..."
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Status Dropdown */}
        <div className="relative inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
          <FiSliders className="text-sm shrink-0" />
          <div className="flex items-center gap-1 overflow-hidden">
            <span className="whitespace-nowrap font-medium text-slate-700">{statusFilter || 'All Status'}</span>
          </div>
          <FiChevronDown className="text-sm ml-auto shrink-0" />
          
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option === 'All Status' ? '' : option}>
                {option}
              </option>
            ))}
          </select>
        </div>
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
