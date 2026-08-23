import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export function VerticalChart({ title, labels, values }) {
  const maxReports = Math.max(...values.map((value) => Number(value) || 0), 0);
  const suggestedMax = Math.max(100, Math.ceil(maxReports / 100) * 100);

  const data = {
    labels,
    datasets: [
      {
        label: "Reports",
        data: values,
        backgroundColor: "#7fb5e8",
        borderRadius: 8,
        barPercentage: 0.55,
        categoryPercentage: 0.7,
      },
    ],
  };

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark'
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'
  const tickColor = isDark ? '#94a3b8' : '#6b7280'

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: tickColor,
          font: { size: 11 },
        },
      },
      y: {
        grid: {
          color: gridColor,
        },
        ticks: {
          color: tickColor,
          font: { size: 11 },
          stepSize: 20,
        },
        suggestedMax,
      },
    },
  };

  return (
    <div className="h-full rounded-lg bg-white p-6 shadow-sm border border-slate-200 flex flex-col">
      <h3 className="mb-4 font-semibold text-slate-900">{title}</h3>
      <div className="flex-1 min-h-55">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
