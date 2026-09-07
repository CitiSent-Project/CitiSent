import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

export function UrgencyDoughnutChart({ title, total, labels, values, colors, legend }) {
  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderWidth: 0,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    cutout: '72%',
  }

  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm flex flex-col min-w-0 w-full dark:border-slate-700/80 dark:bg-slate-800">
      <h3 className="mb-4 font-semibold text-slate-900 text-base md:text-lg dark:text-white">{title}</h3>
      <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-4 w-full min-w-0">
        <div className="relative w-full max-w-50 sm:max-w-60 aspect-square shrink-0 mx-auto">
          <Doughnut data={data} options={options} />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 font-numeric dark:text-slate-100">{total}</span>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
          {legend.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="truncate">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
