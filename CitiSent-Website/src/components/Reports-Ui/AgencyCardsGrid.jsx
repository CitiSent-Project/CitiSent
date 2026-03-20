import { FiLayers } from "react-icons/fi";

const agencyIconById = {
  bplo: "bplo.png",
  cto: "City Treasury Office.png",
  bfp: "BFPoffice.png",
  ctmd: "City Traffic Management.png",
  cvo: "CityVet.png",
  cao: "agriculture.png",
  ccdo: "City Cooperative.png",
  peso: "employment.png",
  pwd: "PWDSenior.png",
};

export function AgencyCardsGrid({ items, selectedItemId, onSelectItem }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const iconFileName = agencyIconById[item.id];
        const iconSrc = iconFileName
          ? encodeURI(`/assets/icons/${iconFileName}`)
          : null;

        return (
          <button
            type="button"
            key={item.id}
            onClick={() => onSelectItem(item.id)}
            className={`w-full rounded-xl px-4 py-3 text-left font-medium transition-all duration-200
                  bg-blue-500 text-white shadow-md hover:bg-blue-700 hover:shadow-lg active:scale-95 active:shadow-inner 
                    focus:outline-none focus:ring-2 focus:ring-blue-800
                    ${
                      selectedItemId === item.id
                        ? "border-2 border-blue-800"
                        : "border-2 border-blue-500/60 hover:border-blue-800"
                    }`}
            aria-pressed={selectedItemId === item.id}
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 text-slate-700">
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
              <p className="text-sm text-white">{item.label}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
