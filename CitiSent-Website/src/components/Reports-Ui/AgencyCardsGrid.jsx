import { FiChevronDown, FiLayers } from 'react-icons/fi'

const agencyIconById = {
  bplo: 'bplo.png',
  cto: 'City Treasury Office.png',
  bfp: 'BFPoffice.png',
  ctmd: 'City Traffic Management.png',
  cvo: 'CityVet.png',
  cao: 'agriculture.png',
  ccdo: 'City Cooperative.png',
  peso: 'employment.png',
  pwd: 'PWDSenior.png',
}

const agencyIconAliases = {
  ...agencyIconById,
  'city-treasury-office': 'City Treasury Office.png',
  'bureau-of-fire-protection-bfp-processing-area': 'BFPoffice.png',
  'city-traffic-management-division-impounding-services': 'City Traffic Management.png',
  'city-veterinary-office': 'CityVet.png',
  'city-agriculture-office': 'agriculture.png',
  'city-cooperative-development-office': 'City Cooperative.png',
  'senior-citizens-pwd-accessibility-services': 'PWDSenior.png',
}

function normalizeAgencyKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function resolveIconFileName(item) {
  const candidates = [
    item?.id,
    item?.label,
    normalizeAgencyKey(item?.id),
    normalizeAgencyKey(item?.label),
  ]

  for (const candidate of candidates) {
    const key = normalizeAgencyKey(candidate)
    if (!key) {
      continue
    }

    if (agencyIconAliases[key]) {
      return agencyIconAliases[key]
    }
  }

  return null
}

export function AgencyCardsGrid({ items, selectedItemId, onSelectItem }) {
  const selectedItem = items.find((item) => item.id === selectedItemId) || items[0]

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Agency Filter</h2>
          <p className="text-sm text-slate-500">Choose an agency to narrow the report feed.</p>
        </div>
      </div>

      <div className="md:hidden">
        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Select Agency
        </label>
        <div className="relative mt-2">
          <select
            value={selectedItemId}
            onChange={(event) => onSelectItem(event.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            aria-label="Select agency"
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        {selectedItem ? (
          <p className="mt-3 text-sm text-slate-600">
            Showing reports for <span className="font-semibold text-slate-900">{selectedItem.label}</span>.
          </p>
        ) : null}
      </div>

      <div className="hidden gap-3 md:grid md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const iconFileName = resolveIconFileName(item)
          const iconSrc = iconFileName ? encodeURI(`/assets/icons/${iconFileName}`) : null
          const isSelected = selectedItemId === item.id

          return (
            <button
              type="button"
              key={item.id}
              onClick={() => onSelectItem(item.id)}
              className={`group w-full rounded-2xl border px-4 py-3 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                isSelected
                  ? 'border-blue-300 bg-blue-50 shadow-[0_8px_24px_rgba(37,99,235,0.12)]'
                  : 'border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-white hover:shadow-sm'
              }`}
              aria-pressed={isSelected}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border ${
                    isSelected
                      ? 'border-blue-200 bg-white text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  {iconSrc ? (
                    <img
                      src={iconSrc}
                      alt={`${item.label} icon`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FiLayers />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                    {item.label}
                  </p>
                  <p className={`text-xs ${isSelected ? 'text-blue-700' : 'text-slate-500'}`}>
                    {isSelected ? 'Currently selected' : 'Filter reports by this agency'}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
