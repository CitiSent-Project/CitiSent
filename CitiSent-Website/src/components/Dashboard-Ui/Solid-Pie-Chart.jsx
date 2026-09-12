import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export function SolidPieChart({ title, total, labels, values, colors, legend = [] }) {
  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 10,
        offset: labels.map((label) =>
          String(label || "").toLowerCase().includes("pending") ? 20 : 0
        ),
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
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
          size: 14,
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
    <div className="h-full rounded-2xl bg-white p-4 md:p-6 shadow-xs border border-slate-200 flex flex-col min-w-0 w-full dark:border-slate-700/80 dark:bg-slate-800">
      <h3 className="mb-4 font-semibold text-slate-900 text-base md:text-lg dark:text-white">{title}</h3>
      <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-4 w-full min-w-0">
        <div className="relative w-full max-w-50 sm:max-w-60 aspect-square shrink-0 mx-auto">
          <Pie data={data} options={options} plugins={[ChartDataLabels]} />
        </div>
        <div className="grid max-h-44 w-full grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto pr-1 text-xs text-slate-600 dark:text-slate-300">
          {legend.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-2"
            >
              <span
                className="mt-1 h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="wrap-break-word leading-tight flex-1">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
