export function UrgencyFilterChips({ chips, selectedChip, onSelectChip }) {
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          type="button"
          key={chip}
          onClick={() => onSelectChip(chip)}
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            selectedChip === chip
              ? 'border border-blue-900 bg-blue-900 text-white'
              : 'border border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100'
          }`}
        >
          {chip}
        </button>
      ))}
    </div>
  )
}
