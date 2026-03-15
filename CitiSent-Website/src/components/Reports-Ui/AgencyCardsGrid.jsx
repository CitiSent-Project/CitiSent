import { FiLayers } from 'react-icons/fi'

export function AgencyCardsGrid({ items, selectedItemId, onSelectItem }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <button
          type="button"
          key={item.id}
          onClick={() => onSelectItem(item.id)}
          className={`rounded-xl border-2 px-4 py-3 text-left transition bg-blue-500 ${
            selectedItemId === item.id
              ? 'border-blue-700 shadow-md bg-blue-500'
              : 'border-blue-100 hover:border-blue-700'
          }`}
          aria-pressed={selectedItemId === item.id}
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full border border-slate-300/60 bg-white/70 text-slate-700">
              <FiLayers />
            </div>
            <p className="text-sm font-semibold text-white">{item.label}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
