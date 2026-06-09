export function EmotionFilterChips({ 
  chips, 
  selectedChip, 
  onSelectChip 
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Emotion:</span>
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
  );
}
