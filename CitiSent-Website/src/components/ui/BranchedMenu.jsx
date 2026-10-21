import { isValidElement, useLayoutEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
	CursorPointer01Icon,
	Download04Icon,
	Layers01Icon,
	Notification03Icon,
	PaintBoardIcon,
	Rocket01Icon,
	Settings02Icon,
	TextFontIcon,
} from '@hugeicons/core-free-icons'
import './BranchedMenu.css'

const DEFAULT_ITEMS = [
	{
		label: 'Getting started',
		children: [
			{ value: 'install', label: 'Installation', icon: Download04Icon },
			{ value: 'quick', label: 'Quick start', icon: Rocket01Icon },
			{ value: 'config', label: 'Configuration', icon: Settings02Icon },
			{ value: 'theming', label: 'Theming', icon: PaintBoardIcon },
		],
	},
	{
		label: 'Components',
		children: [
			{ value: 'buttons', label: 'Buttons', icon: CursorPointer01Icon },
			{ value: 'typography', label: 'Typography', icon: TextFontIcon },
			{ value: 'overlays', label: 'Overlays', icon: Layers01Icon },
			{ value: 'toasts', label: 'Toasts', icon: Notification03Icon },
		],
	},
]

const PAD = 4
const MARK = 16

function renderMenuIcon(icon) {
	if (!icon) return null
	if (isValidElement(icon)) return icon

	if (typeof icon === 'function') {
		const IconComp = icon
		return <IconComp size={15} />
	}

	return <HugeiconsIcon icon={icon} size={15} strokeWidth={1.8} />
}

const toSet = (open) => new Set(Array.isArray(open) ? open : open >= 0 ? [open] : [])

/**
 * BranchedSubtree renders the SVG tree lines and child branch items.
 * Can be used standalone or embedded in accordions.
 */
export function BranchedSubtree({
	kids = [],
	active = '',
	onSelect,
	isOpen = true,
	rowHeight = 34,
	indent = 38,
	trunk = 14,
	radius = 10,
	lineWidth = 1.5,
	drawDuration = 400,
	color = '#f8fafc',
	accentColor = '#3b82f6',
	lineColor = '#334155',
	fontSize = 13,
	className = '',
}) {
	const r = Math.min(radius, rowHeight / 2 - 2)
	const endX = indent - 8
	const rowY = (k) => PAD + k * rowHeight + rowHeight / 2
	const branch = (k) => `M ${trunk} ${rowY(k) - r} A ${r} ${r} 0 0 0 ${trunk + r} ${rowY(k)} H ${endX}`
	const reach = (k) => `M ${trunk} 0 V ${rowY(k) - r} A ${r} ${r} 0 0 0 ${trunk + r} ${rowY(k)} H ${endX}`
	const length = (k) => rowY(k) - r + (Math.PI * r) / 2 + (endX - trunk - r)
	const bodyH = PAD * 2 + kids.length * rowHeight

	return (
		<div
			className={`branched-menu__tree branched-menu__tree--visible ${className}`}
			style={{
				height: bodyH,
				'--bm-ink': color,
				'--bm-accent': accentColor,
				'--bm-line': lineColor,
				'--bm-font': `${fontSize}px`,
				'--bm-row': `${rowHeight}px`,
				'--bm-indent': `${indent}px`,
				'--bm-line-w': lineWidth,
				'--bm-draw': `${drawDuration}ms`,
			}}
		>
			<svg className="branched-menu__lines" width={indent} height={bodyH} aria-hidden="true">
				<path className="branched-menu__base" d={`M ${trunk} 0 V ${rowY(kids.length - 1) - r}`} />
				{kids.map((kid, k) => (
					<path key={kid.value ?? kid.pageKey ?? kid.label} className="branched-menu__base" d={branch(k)} />
				))}
				{kids.map((kid, k) => {
					const val = kid.value ?? kid.pageKey ?? kid.label
					const isKidActive = val === active
					return (
						<path
							key={val}
							className="branched-menu__reach"
							d={reach(k)}
							style={{
								strokeDasharray: length(k),
								strokeDashoffset: isKidActive ? 0 : length(k),
							}}
						/>
					)
				})}
			</svg>
			{kids.map((kid) => {
				const val = kid.value ?? kid.pageKey ?? kid.label
				const isKidActive = val === active
				return (
					<button
						key={val}
						type="button"
						className="branched-menu__item"
						aria-current={isKidActive ? 'true' : undefined}
						data-active={isKidActive ? '' : undefined}
						tabIndex={isOpen ? 0 : -1}
						onClick={() => onSelect?.(val, kid)}
					>
						{kid.icon ? (
							<span className="branched-menu__icon" aria-hidden="true">
								{renderMenuIcon(kid.icon)}
							</span>
						) : null}
						<span className="branched-menu__label">{kid.label}</span>
					</button>
				)
			})}
		</div>
	)
}

export default function BranchedMenu({
	items = DEFAULT_ITEMS,
	defaultOpen = 0,
	defaultActive = '',
	active: controlledActive,
	onSelect,
	onToggle,
	color = '#f8fafc',
	accentColor = '#3b82f6',
	lineColor = '#334155',
	width = 240,
	rowHeight = 34,
	indent = 38,
	trunk = 14,
	radius = 10,
	lineWidth = 1.5,
	fontSize = 13,
	drawDuration = 400,
	foldDuration = 300,
	className = '',
}) {
	const [open, setOpen] = useState(() => toSet(defaultOpen))
	const [uncontrolledActive, setUncontrolledActive] = useState(() => {
		if (defaultActive) return defaultActive
		const first = items.find((it, i) => it.children && toSet(defaultOpen).has(i))
		return first?.children?.[0]?.value ?? first?.children?.[0]?.pageKey ?? ''
	})

	const active = controlledActive !== undefined ? controlledActive : uncontrolledActive

	// Sync open sections if active item changes
	const [prevActive, setPrevActive] = useState(active)
	if (prevActive !== active) {
		setPrevActive(active)
		const matchedSection = items.findIndex((it) =>
			it.children?.some((kid) => (kid.value ?? kid.pageKey) === active)
		)
		if (matchedSection >= 0 && !open.has(matchedSection)) {
			const next = new Set(open)
			next.add(matchedSection)
			setOpen(next)
		}
	}

	const navRef = useRef(null)
	const heads = useRef([])
	const markerRef = useRef(null)

	const activeSection = items.findIndex((it) =>
		it.children?.some((kid) => (kid.value ?? kid.pageKey) === active)
	)
	const markerShown = activeSection >= 0 && open.has(activeSection)

	useLayoutEffect(() => {
		const place = (glide) => {
			const m = markerRef.current
			const el = heads.current[activeSection]
			if (!m) return
			const on = markerShown && el
			if (!glide) m.style.transition = 'none'
			if (on) m.style.top = `${el.offsetTop + (el.offsetHeight - MARK) / 2}px`
			m.toggleAttribute('data-on', Boolean(on))
			if (!glide) {
				void m.offsetHeight
				m.style.transition = ''
			}
		}

		place(true)

		let first = true
		if (typeof ResizeObserver === 'undefined' || !navRef.current) return

		const ro = new ResizeObserver(() => {
			if (first) {
				first = false
				return
			}
			place(false)
		})
		ro.observe(navRef.current)
		return () => ro.disconnect()
	}, [activeSection, markerShown, items, fontSize, rowHeight])

	const select = (value, item) => {
		if (controlledActive === undefined) {
			setUncontrolledActive(value)
		}
		onSelect?.(value, item)
	}

	const toggle = (i) => {
		setOpen((prev) => {
			const next = new Set(prev)
			const isOpen = !next.has(i)
			if (isOpen) next.add(i)
			else next.delete(i)
			onToggle?.(i, isOpen)
			return next
		})
	}

	const r = Math.min(radius, rowHeight / 2 - 2)
	const endX = indent - 8
	const rowY = (k) => PAD + k * rowHeight + rowHeight / 2
	const branch = (k) => `M ${trunk} ${rowY(k) - r} A ${r} ${r} 0 0 0 ${trunk + r} ${rowY(k)} H ${endX}`
	const reach = (k) => `M ${trunk} 0 V ${rowY(k) - r} A ${r} ${r} 0 0 0 ${trunk + r} ${rowY(k)} H ${endX}`
	const length = (k) => rowY(k) - r + (Math.PI * r) / 2 + (endX - trunk - r)

	return (
		<nav
			ref={navRef}
			className={`branched-menu${className ? ` ${className}` : ''}`}
			style={{
				'--bm-w': `${width}px`,
				'--bm-ink': color,
				'--bm-accent': accentColor,
				'--bm-line': lineColor,
				'--bm-font': `${fontSize}px`,
				'--bm-row': `${rowHeight}px`,
				'--bm-indent': `${indent}px`,
				'--bm-line-w': lineWidth,
				'--bm-draw': `${drawDuration}ms`,
				'--bm-fold': `${foldDuration}ms`,
			}}
		>
			<span ref={markerRef} className="branched-menu__marker" aria-hidden="true" />
			{items.map((item, i) => {
				const kids = item.children
				const isOpen = kids ? open.has(i) : false
				const leafValue = item.value ?? item.pageKey ?? item.label
				const leafActive = !kids && leafValue === active
				const bodyH = kids ? PAD * 2 + kids.length * rowHeight : 0

				return (
					<div
						key={item.value ?? item.pageKey ?? item.label}
						className="branched-menu__section"
						data-open={isOpen ? '' : undefined}
					>
						<button
							ref={(el) => {
								heads.current[i] = el
							}}
							type="button"
							className="branched-menu__head"
							aria-expanded={kids ? isOpen : undefined}
							aria-current={leafActive ? 'true' : undefined}
							data-active={leafActive ? '' : undefined}
							onClick={() => (kids ? toggle(i) : select(leafValue, item))}
						>
							{item.label}
						</button>
						{kids ? (
							<div className="branched-menu__body">
								<div className="branched-menu__fold">
									<div className="branched-menu__tree" style={{ height: bodyH }}>
										<svg className="branched-menu__lines" width={indent} height={bodyH} aria-hidden="true">
											<path className="branched-menu__base" d={`M ${trunk} 0 V ${rowY(kids.length - 1) - r}`} />
											{kids.map((kid, k) => (
												<path
													key={kid.value ?? kid.pageKey ?? kid.label}
													className="branched-menu__base"
													d={branch(k)}
												/>
											))}
											{kids.map((kid, k) => {
												const val = kid.value ?? kid.pageKey ?? kid.label
												const isKidActive = val === active
												return (
													<path
														key={val}
														className="branched-menu__reach"
														d={reach(k)}
														style={{
															strokeDasharray: length(k),
															strokeDashoffset: isKidActive ? 0 : length(k),
														}}
													/>
												)
											})}
										</svg>
										{kids.map((kid) => {
											const val = kid.value ?? kid.pageKey ?? kid.label
											const isKidActive = val === active
											return (
												<button
													key={val}
													type="button"
													className="branched-menu__item"
													aria-current={isKidActive ? 'true' : undefined}
													data-active={isKidActive ? '' : undefined}
													tabIndex={isOpen ? 0 : -1}
													onClick={() => select(val, kid)}
												>
													{kid.icon ? (
														<span className="branched-menu__icon" aria-hidden="true">
															{renderMenuIcon(kid.icon)}
														</span>
													) : null}
													<span className="branched-menu__label">{kid.label}</span>
												</button>
											)
										})}
									</div>
								</div>
							</div>
						) : null}
					</div>
				)
			})}
		</nav>
	)
}
