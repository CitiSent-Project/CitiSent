import {
	ArcElement,
	Chart as ChartJS,
	Legend,
	Tooltip,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

export function PieChart({ title, total, labels, values, colors, legend }) {
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
			legend: {
				display: false,
			},
			tooltip: {
				enabled: true,
			},
		},
		cutout: '70%',
	}

	return (
		<div className="h-full rounded-lg bg-white p-6 shadow-sm border border-slate-200 flex flex-col">
			<h3 className="mb-4 font-semibold text-slate-900">{title}</h3>
			<div className="flex flex-1 min-h-0 flex-col items-center gap-4">
				<div className="relative w-full max-w-[320px] flex-1 min-h-55">
					<Doughnut data={data} options={options} />
					<div className="absolute inset-0 flex items-center justify-center">
						<span className="text-lg font-semibold text-slate-800">{total}</span>
					</div>
				</div>
				<div className="grid max-h-40 w-full grid-cols-1 gap-2 overflow-y-auto pr-1 text-xs text-slate-600 md:grid-cols-2">
					{legend.map((item, index) => {
						const isLastOdd = legend.length % 2 === 1 && index === legend.length - 1

						return (
							<div
								key={item.label}
								className={`flex items-start gap-2 ${isLastOdd ? 'md:col-span-2 md:justify-center' : ''}`}
							>
								<span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
								<span className="wrap-break-word leading-tight">{item.label}</span>
							</div>
						)
					})}
				</div>
			</div>
		</div>
	)
}
