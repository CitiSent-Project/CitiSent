import { FiLayers } from 'react-icons/fi'

export function AgencyCardsGrid({ items, selectedItemId, onSelectItem }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <button
          type="button"
          key={item.id}
          onClick={() => onSelectItem(item.id)}
          className={`rounded-xl border px-4 py-3 text-left transition ${item.tone} ${
            selectedItemId === item.id
              ? 'border-blue-900 shadow-[inset_0_0_0_1px_rgba(30,58,138,0.3)]'
              : 'border-blue-200 hover:border-blue-400'
          }`}
          aria-pressed={selectedItemId === item.id}
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full border border-slate-300/60 bg-white/70 text-slate-700">
              <FiLayers />
            </div>
            <p className="text-sm font-semibold text-slate-800">{item.label}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
