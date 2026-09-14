import { useEffect, useRef, useState } from 'react'

function SkeletonBlock({ className = '' }) {
	return (
		<div
			aria-hidden="true"
			className={`animate-shimmer rounded-xl bg-slate-200/80 dark:bg-slate-700/80 ${className}`.trim()}
		/>
	)
}

function RefreshingBanner({ text, className = '' }) {
	return (
		<div
			aria-hidden="true"
			className={`flex items-center justify-between gap-3 px-4 py-2 text-xs font-medium text-slate-500 ${className}`.trim()}
		>
			<span>{text}</span>
			<SkeletonBlock className="h-2 w-16 rounded-full" />
		</div>
	)
}

function TableBodyLoader({ rows, columns, rowClassName = '', cellClassName = '' }) {
	return Array.from({ length: rows }).map((_, rowIndex) => (
		<tr key={rowIndex} className={`border-b border-slate-100 dark:border-slate-700/50 ${rowClassName}`.trim()}>
			{Array.from({ length: columns }).map((__, columnIndex) => (
				<td
					key={columnIndex}
					className={`px-4 py-3 ${columnIndex === columns - 1 ? 'text-right' : ''}`.trim()}
				>
					<SkeletonBlock
						className={
							cellClassName ||
							(columnIndex === 0
								? 'h-4 w-20'
								: columnIndex === columns - 1
									? 'ml-auto h-9 w-14 rounded-lg'
									: 'h-4 w-24')
						}
					/>
				</td>
			))}
		</tr>
	))
}

function UsersGridLoader({ rows, gridTemplateColumnsClass, rowClassName = '' }) {
	return Array.from({ length: rows }).map((_, rowIndex) => (
		<div
			key={rowIndex}
			className={`grid items-center gap-3 border-b border-slate-200 dark:border-slate-700/50 px-4 py-3 ${gridTemplateColumnsClass} ${rowClassName}`.trim()}
		>
			<div className="flex justify-center">
				<SkeletonBlock className="h-4 w-4 rounded-sm" />
			</div>
			<div className="flex items-center gap-3">
				<SkeletonBlock className="h-9 w-9 rounded-full" />
				<div className="min-w-0 space-y-2">
					<SkeletonBlock className="h-4 w-28" />
					<SkeletonBlock className="h-3 w-36" />
				</div>
			</div>
			<SkeletonBlock className="h-4 w-32" />
			<SkeletonBlock className="h-6 w-20 rounded-full" />
			<SkeletonBlock className="h-4 w-24" />
			<div className="flex justify-end">
				<SkeletonBlock className="h-9 w-9 rounded-full" />
			</div>
		</div>
	))
}

export function TableLoader({
	isLoading,
	delayMs = 300,
	minDisplayMs = 500,
	rows = 4,
	columns = 6,
	layout = 'table',
	gridTemplateColumnsClass = 'grid-cols-6',
	rowClassName = '',
	cellClassName = '',
	className = '',
	label = 'Loading table data...',
	variant = 'skeleton',
	refreshText = 'Refreshing...',
}) {
	const [isVisible, setIsVisible] = useState(() => Boolean(isLoading && delayMs <= 0))
	const resolvedRows = variant === 'refreshing' ? Math.max(0, rows - 1) : rows
	const visibleSinceRef = useRef(null)
	const showTimeoutRef = useRef(null)
	const hideTimeoutRef = useRef(null)

	useEffect(() => {
		if (showTimeoutRef.current) {
			window.clearTimeout(showTimeoutRef.current)
			showTimeoutRef.current = null
		}

		if (hideTimeoutRef.current) {
			window.clearTimeout(hideTimeoutRef.current)
			hideTimeoutRef.current = null
		}

		if (isLoading) {
			if (isVisible) {
				if (!visibleSinceRef.current) {
					visibleSinceRef.current = Date.now()
				}
				return undefined
			}

			const showAfterMs = delayMs <= 0 ? 0 : delayMs
			showTimeoutRef.current = window.setTimeout(() => {
				visibleSinceRef.current = Date.now()
				setIsVisible(true)
				showTimeoutRef.current = null
			}, showAfterMs)

			return () => {
				if (showTimeoutRef.current) {
					window.clearTimeout(showTimeoutRef.current)
					showTimeoutRef.current = null
				}
			}
		}

		if (!isVisible) {
			return undefined
		}

		const visibleSince = visibleSinceRef.current || Date.now()
		if (!visibleSinceRef.current) {
			visibleSinceRef.current = visibleSince
		}

		const remainingMs =
			minDisplayMs <= 0 ? 0 : Math.max(0, minDisplayMs - (Date.now() - visibleSince))

		hideTimeoutRef.current = window.setTimeout(() => {
			setIsVisible(false)
			visibleSinceRef.current = null
			hideTimeoutRef.current = null
		}, remainingMs)

		return () => {
			if (hideTimeoutRef.current) {
				window.clearTimeout(hideTimeoutRef.current)
				hideTimeoutRef.current = null
			}
		}
	}, [delayMs, isLoading, isVisible, minDisplayMs])

	if (!isVisible) {
		return null
	}

	if (layout === 'users-grid') {
		return (
			<div aria-busy="true" aria-live="polite" role="status" className={className}>
				<span className="sr-only">{label}</span>
				{variant === 'refreshing' ? (
					<RefreshingBanner text={refreshText} className="border-b border-slate-200 bg-slate-50 dark:border-slate-700/50 dark:bg-slate-800/50" />
				) : null}
				<UsersGridLoader
					rows={resolvedRows}
					gridTemplateColumnsClass={gridTemplateColumnsClass}
					rowClassName={rowClassName}
				/>
			</div>
		)
	}

	return (
		<tbody aria-busy="true" aria-live="polite" role="status" className={className}>
			<tr className="sr-only">
				<td colSpan={columns}>{label}</td>
			</tr>
			{variant === 'refreshing' ? (
				<tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-700/50 dark:bg-slate-800/50">
					<td colSpan={columns} className="p-0">
						<RefreshingBanner text={refreshText} />
					</td>
				</tr>
			) : null}
			<TableBodyLoader
				rows={resolvedRows}
				columns={columns}
				rowClassName={rowClassName}
				cellClassName={cellClassName}
			/>
		</tbody>
	)
}
