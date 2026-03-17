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
              ? "bg-blue-700 text-white"
              : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 transition duration-300"
          }`}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
