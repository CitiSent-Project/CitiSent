import { FiLayers } from 'react-icons/fi'

export function AgencyCardsGrid({ items }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <article key={item.id} className={`rounded-xl border border-slate-200 px-4 py-3 ${item.tone}`}>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full border border-slate-300/60 bg-white/70 text-slate-700">
              <FiLayers />
            </div>
            <p className="text-sm font-semibold text-slate-800">{item.label}</p>
          </div>
        </article>
      ))}
    </div>
  )
}
