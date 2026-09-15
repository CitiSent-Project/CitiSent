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

function UsersGridLoader({ rows, gridTemplateColumnsClass = '', rowClassName = '' }) {
	const desktopGridClass = gridTemplateColumnsClass.includes('grid-cols-')
		? gridTemplateColumnsClass.split(' ').map((c) => (c.startsWith('grid-cols-') ? `lg:${c}` : c)).join(' ')
		: gridTemplateColumnsClass || 'lg:grid-cols-[32px_minmax(0,2.2fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_80px]'

	return Array.from({ length: rows }).map((_, rowIndex) => (
		<div
			key={rowIndex}
			className={`relative border-b border-slate-100 px-4 py-4 dark:border-slate-700/50 lg:grid ${desktopGridClass} lg:items-center lg:gap-4 lg:px-5 lg:py-3.5 ${rowClassName}`.trim()}
		>
			{/* Checkbox skeleton — top-left on mobile, static cell on desktop */}
			<div className="absolute left-4 top-4.5 lg:static lg:flex lg:items-center lg:justify-center">
				<SkeletonBlock className="h-4 w-4 rounded-sm" />
			</div>

			{/* User Details skeleton — avatar + name & email */}
			<div className="flex min-w-0 items-center gap-3 ml-8 pr-11 lg:ml-0 lg:pr-0">
				<SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
				<div className="min-w-0 flex-1 space-y-1.5">
					<SkeletonBlock className="h-4 w-32 max-w-full sm:w-44" />
					<SkeletonBlock className="h-3 w-20 max-w-full sm:w-28" />
				</div>
			</div>

			{/* Account Status skeleton */}
			<div className="mt-2.5 ml-11 lg:mt-0 lg:ml-0 flex items-center gap-2">
				<SkeletonBlock className="h-3 w-10 lg:hidden" />
				<SkeletonBlock className="h-6 w-20 rounded-full" />
			</div>

			{/* Registered Date skeleton */}
			<div className="mt-2 ml-11 lg:mt-0 lg:ml-0 flex items-center gap-2">
				<SkeletonBlock className="h-3 w-16 lg:hidden" />
				<SkeletonBlock className="h-3.5 w-24" />
			</div>

			{/* Action button skeleton — top-right on mobile, flex-end on desktop */}
			<div className="absolute right-4 top-4 lg:static lg:flex lg:items-center lg:justify-end">
				<SkeletonBlock className="h-8.5 w-8.5 rounded-full" />
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
