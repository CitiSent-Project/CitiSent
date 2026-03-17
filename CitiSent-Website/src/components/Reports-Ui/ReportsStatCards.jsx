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
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat) => {
        const Icon = iconMap[stat.icon] ?? FiFolder;

        return (
          <div
            key={stat.id}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
          >
            <div
              className={`grid h-12 w-12 place-items-center rounded-xl ${accentMap[stat.accent]}`}
            >
              <Icon className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="text-4xl font-bold leading-none text-slate-900 font-numeric">
                {stat.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
