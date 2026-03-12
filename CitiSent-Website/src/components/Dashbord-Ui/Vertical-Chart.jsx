import {
	BarElement,
	CategoryScale,
	Chart as ChartJS,
	Legend,
	LinearScale,
	Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

export function VerticalChart({ title, labels, values }) {
	const data = {
		labels,
		datasets: [
			{
				label: 'Reports',
				data: values,
				backgroundColor: '#7fb5e8',
				borderRadius: 8,
				barPercentage: 0.55,
				categoryPercentage: 0.7,
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
		scales: {
			x: {
				grid: {
					display: false,
				},
				ticks: {
					color: '#6b7280',
					font: { size: 11 },
				},
			},
			y: {
				grid: {
					color: '#e5e7eb',
				},
				ticks: {
					color: '#6b7280',
					font: { size: 11 },
					stepSize: 100,
				},
				suggestedMax: 300,
			},
		},
	}

	return (
		<div className="h-full rounded-lg bg-white p-6 shadow-sm border border-slate-200 flex flex-col">
			<h3 className="mb-4 font-semibold text-slate-900">{title}</h3>
			<div className="flex-1 min-h-55">
				<Bar data={data} options={options} />
			</div>
		</div>
	)
}
