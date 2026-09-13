import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export function SolidPieChart({ title, labels, values, colors, legend = [] }) {
  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 12,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 10,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.raw || 0;
            const dataset = context.chart.data.datasets[context.datasetIndex];
            const sum = dataset.data.reduce((a, b) => a + b, 0);
            const percentage = sum > 0 ? ((value * 100) / sum).toFixed(1) : "0.0";
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
      datalabels: {
        color: "#ffffff",
        font: {
          weight: "bold",
          size: 13,
        },
        formatter: (value, context) => {
          if (value === 0) return null;
          const dataset = context.chart.data.datasets[context.datasetIndex];
          const sum = dataset.data.reduce((a, b) => a + b, 0);
          const percentage = sum > 0 ? Math.round((value * 100) / sum) : 0;
          return `${percentage}%`;
        },
        display: (context) => {
          return context.dataset.data[context.dataIndex] > 0;
        },
      },
    },
  };

  return (
    <div className="h-full rounded-2xl bg-white p-4 sm:p-5 xl:p-6 shadow-xs border border-slate-200 flex flex-col min-w-0 w-full overflow-hidden dark:border-slate-700/80 dark:bg-slate-800">
      <h3 className="mb-3 sm:mb-4 font-semibold text-slate-900 text-sm sm:text-base md:text-lg dark:text-white shrink-0">
        {title}
      </h3>
      <div className="flex flex-1 min-h-0 flex-col lg:flex-row items-center justify-center gap-4 sm:gap-6 xl:gap-8 w-full min-w-0">
        <div className="relative w-40 h-40 sm:w-48 sm:h-48 lg:w-44 lg:h-44 xl:w-52 xl:h-52 2xl:w-56 2xl:h-56 shrink-0 mx-auto lg:mx-0">
          <Pie data={data} options={options} plugins={[ChartDataLabels]} />
        </div>
        <div className="grid w-full lg:w-auto lg:shrink-0 lg:max-w-xs min-h-0 max-h-44 sm:max-h-56 lg:max-h-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5 sm:gap-2 xl:gap-2.5 overflow-y-auto pr-1 text-xs xl:text-sm text-slate-600 dark:text-slate-300 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full p-1">
          {legend.map((item) => (
            <div
              key={item.label}
              className="group flex items-center gap-3 py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-xl transition-all duration-200 ease-in-out hover:bg-slate-100/90 dark:hover:bg-slate-700/60 hover:shadow-xs cursor-pointer min-w-0"
              title={item.label}
            >
              <span
                className="h-2.5 w-2.5 xl:h-3 xl:w-3 shrink-0 rounded-full ring-2 ring-white/10 dark:ring-white/20 transition-transform duration-200 group-hover:scale-125"
                style={{ backgroundColor: item.color }}
              />
              <span className="wrap-break-word leading-snug flex-1 font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-200">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
