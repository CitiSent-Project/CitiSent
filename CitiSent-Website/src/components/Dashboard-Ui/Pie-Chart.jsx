import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export function PieChart({ title, total, labels = [], values = [], colors = [], legend = [] }) {
  const isSingleCategory = legend.length === 1;
  const isAllZero = values.length === 0 || values.every((v) => Number(v) === 0);

  const chartData = {
    labels: isAllZero ? (labels.length > 0 ? labels : ["No Reports"]) : labels,
    datasets: [
      {
        data: isAllZero ? [1] : values,
        backgroundColor: isAllZero ? ["#cbd5e1"] : colors,
        borderWidth: 0,
        hoverOffset: isAllZero ? 0 : 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 6,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: !isAllZero,
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = isAllZero ? 0 : (context.raw || 0);
            return `${label}: ${value} reports`;
          },
        },
      },
    },
    cutout: "72%",
  };

  return (
    <div className="h-full rounded-2xl bg-white p-4 sm:p-5 xl:p-6 shadow-2xs border border-slate-200/80 flex flex-col min-w-0 w-full overflow-hidden dark:border-slate-700/80 dark:bg-slate-800 transition-colors duration-200">
      <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
        <h3 className="font-semibold text-slate-900 text-sm sm:text-base md:text-lg dark:text-white">
          {title}
        </h3>
        {isSingleCategory && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Assigned Scope
          </span>
        )}
      </div>

      <div className="flex flex-1 min-h-0 flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6 xl:gap-8 w-full min-w-0">
        {/* Doughnut Ring */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 lg:w-40 lg:h-40 xl:w-44 xl:h-44 2xl:w-48 2xl:h-48 shrink-0 mx-auto lg:mx-0">
          <Doughnut data={chartData} options={options} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
            <span className="text-xl sm:text-2xl xl:text-3xl font-extrabold text-slate-900 font-numeric dark:text-white tracking-tight leading-none">
              {total}
            </span>
            <span className="text-[10px] sm:text-xs font-medium text-slate-400 dark:text-slate-400 mt-1 uppercase tracking-wider">
              {Number(total) === 1 ? 'Report' : 'Reports'}
            </span>
          </div>
        </div>

        {/* Legend / Office Card */}
        {isSingleCategory ? (
          <div className="flex flex-col justify-center items-start gap-2.5 w-full lg:w-auto flex-1 min-w-0 max-w-sm bg-slate-50/80 dark:bg-slate-900/60 rounded-xl p-3.5 sm:p-4 border border-slate-200/70 dark:border-slate-700/60">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white dark:ring-slate-800 shadow-2xs"
                style={{ backgroundColor: legend[0]?.color || '#10b981' }}
              />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Department
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug break-words">
              {legend[0]?.label}
            </p>
            <div className="mt-1 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between w-full">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Active Volume
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white font-numeric">
                {legend[0]?.value ?? total} {Number(legend[0]?.value ?? total) === 1 ? 'report' : 'reports'}
              </span>
            </div>
          </div>
        ) : (
          <div className="grid w-full lg:w-auto flex-1 min-w-0 max-w-sm min-h-0 max-h-44 sm:max-h-56 lg:max-h-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1 sm:gap-1.5 overflow-y-auto pr-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full p-0.5">
            {legend.map((item) => (
              <div
                key={item.label}
                className="group flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-lg transition-all duration-200 ease-in-out hover:bg-slate-100/90 dark:hover:bg-slate-700/60 hover:shadow-2xs cursor-pointer min-w-0"
                title={`${item.label}: ${item.value ?? item.count ?? 0}`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full transition-transform duration-200 group-hover:scale-125 ring-1 ring-black/5 dark:ring-white/10"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate leading-tight font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-200">
                    {item.label}
                  </span>
                </div>
                {item.value !== undefined && (
                  <span className="font-numeric font-semibold text-xs text-slate-600 dark:text-slate-400 shrink-0 ml-2 group-hover:text-slate-900 dark:group-hover:text-white">
                    {item.value}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
