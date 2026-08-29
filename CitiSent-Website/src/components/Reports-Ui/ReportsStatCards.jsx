import { FiAlertCircle, FiCheckCircle, FiFolder } from "react-icons/fi";

const iconMap = {
  folder: FiFolder,
  resolved: FiCheckCircle,
  unresolved: FiAlertCircle,
};

const accentMap = {
  green: "bg-green-800 text-green-100",
  amber: "bg-amber-800 text-amber-100",
  violet: "bg-purple-800 text-purple-100",
};

export function ReportsStatCards({ stats }) {
  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full min-w-0">
      {stats.map((stat) => {
        const Icon = iconMap[stat.icon] ?? FiFolder;

        return (
          <div
            key={stat.id}
            className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:px-5 sm:py-4 shadow-sm min-w-0"
          >
            <div
              className={`grid h-10 w-10 sm:h-12 sm:w-12 shrink-0 place-items-center rounded-xl ${accentMap[stat.accent]}`}
            >
              <Icon className="text-lg sm:text-xl" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-slate-500 truncate">{stat.label}</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-slate-900 font-numeric">
                {stat.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
