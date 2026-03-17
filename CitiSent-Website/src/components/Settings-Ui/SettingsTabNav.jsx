export function SettingsTabNav({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onTabChange(tab)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            activeTab === tab
              ? 'bg-blue-900 text-white'
              : 'border border-slate-300 bg-white text-slate-700 hover:bg-blue-100'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
