export function SettingsTabNav({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Settings sections">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onTabChange(tab)}
          role="tab"
          aria-selected={activeTab === tab}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            activeTab === tab
              ? "bg-blue-900 text-white"
              : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
