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
    <div className="h-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">{title}</h3>
      <div className="grid gap-4 lg:grid-cols-[300px_1fr] lg:items-center">
        <div className="relative mx-auto h-72 w-72">
          <Doughnut data={data} options={options} />
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-3xl font-bold text-slate-900">{total}</span>
          </div>
        </div>

        <div className="space-y-3">
          {legend.map((item) => (
            <div key={item.label} className="flex items-center gap-3 text-sm text-slate-700">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
