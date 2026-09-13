import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export function PieChart({ title, total, labels, values, colors, legend = [] }) {
  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 10,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 8,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
    },
    cutout: "70%",
  };

  return (
    <div className="h-full rounded-2xl bg-white p-4 sm:p-5 xl:p-6 shadow-xs border border-slate-200 flex flex-col min-w-0 w-full overflow-hidden dark:border-slate-700/80 dark:bg-slate-800">
      <h3 className="mb-2.5 sm:mb-3 font-semibold text-slate-900 text-sm sm:text-base md:text-lg dark:text-white shrink-0">
        {title}
      </h3>
      <div className="flex flex-1 min-h-0 flex-col lg:flex-row items-center justify-center gap-4 lg:gap-4 xl:gap-6 2xl:gap-8 w-full min-w-0">
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 lg:w-36 lg:h-36 xl:w-40 xl:h-40 2xl:w-48 2xl:h-48 shrink-0 mx-auto lg:mx-0">
          <Doughnut data={data} options={options} />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-lg sm:text-xl xl:text-2xl font-bold text-slate-800 font-numeric dark:text-slate-100">
              {total}
            </span>
          </div>
        </div>
        <div className="grid w-full lg:w-auto flex-1 min-w-0 max-w-sm min-h-0 max-h-44 sm:max-h-56 lg:max-h-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1 sm:gap-1.5 overflow-y-auto pr-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full p-0.5">
          {legend.map((item) => (
            <div
              key={item.label}
              className="group flex items-start gap-2 py-1 px-2.5 rounded-lg transition-all duration-200 ease-in-out hover:bg-slate-100/90 dark:hover:bg-slate-700/60 hover:shadow-xs cursor-pointer min-w-0"
              title={item.label}
            >
              <span
                className="mt-1 h-2 w-2 shrink-0 rounded-full transition-transform duration-200 group-hover:scale-125"
                style={{ backgroundColor: item.color }}
              />
              <span className="wrap-break-word leading-tight flex-1 font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-200">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
