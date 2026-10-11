export function EmotionFilterChips({ 
  chips, 
  selectedChip, 
  onSelectChip 
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mr-1 dark:text-slate-400">Emotion:</span>
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
  );
}
