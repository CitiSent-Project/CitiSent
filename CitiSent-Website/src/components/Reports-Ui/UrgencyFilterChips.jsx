export function UrgencyFilterChips({ chips, selectedChip, onSelectChip }) {
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          type="button"
          key={chip}
          onClick={() => onSelectChip(chip)}
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            selectedChip === chip ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {chip}
        </button>
      ))}
    </div>
  )
}
