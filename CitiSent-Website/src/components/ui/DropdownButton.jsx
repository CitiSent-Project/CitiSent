import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { FiChevronDown } from 'react-icons/fi'

function normalizeOption(option, index) {
	if (option && typeof option === 'object') {
		const value = Object.prototype.hasOwnProperty.call(option, 'value')
			? option.value
			: option.label

		return {
			key: Object.prototype.hasOwnProperty.call(option, 'key')
				? option.key
				: `${String(value ?? '')}-${index}`,
			value: value ?? '',
			label: Object.prototype.hasOwnProperty.call(option, 'label')
				? option.label
				: String(value ?? ''),
			disabled: Boolean(option.disabled),
		}
	}

	return {
		key: `${String(option ?? '')}-${index}`,
		value: option ?? '',
		label: String(option ?? ''),
		disabled: false,
	}
}

function toComparableValue(value) {
	return String(value ?? '')
}

export function DropdownButton({
	label,
	value,
	options = [],
	onChange,
	icon: Icon,
	className = '',
	placeholder = 'Select an option',
	ariaLabel,
	disabled = false,
	id,
	name,
}) {
	const reactId = useId()
	const listboxId = id ? `${id}__listbox` : `dropdown__listbox__${reactId}`
	const triggerRef = useRef(null)
	const popoverRef = useRef(null)
	const [open, setOpen] = useState(false)
	const [activeIndex, setActiveIndex] = useState(-1)

	const normalizedOptions = useMemo(
		() => options.map((option, index) => normalizeOption(option, index)),
		[options],
	)
	const comparableValue = toComparableValue(value)

	const selectedOption =
		normalizedOptions.find((option) => toComparableValue(option.value) === comparableValue) || null

	const selectedLabel = selectedOption
		? String(selectedOption.label ?? '')
		: comparableValue
			? String(value)
			: placeholder

	const isPlaceholder = !selectedOption && !comparableValue

	function closePopover({ restoreFocus = true } = {}) {
		setOpen(false)
		setActiveIndex(-1)
		if (restoreFocus) {
			triggerRef.current?.focus?.()
		}
	}

	function openPopover() {
		if (disabled) return
		setOpen(true)
		const selectedIndex = normalizedOptions.findIndex(
			(option) => toComparableValue(option.value) === comparableValue,
		)
		if (selectedIndex >= 0) {
			setActiveIndex(selectedIndex)
			return
		}

		const firstEnabledIndex = normalizedOptions.findIndex((option) => !option.disabled)
		setActiveIndex(firstEnabledIndex)
	}

	function togglePopover() {
		if (open) {
			closePopover({ restoreFocus: false })
			return
		}
		openPopover()
	}

	function commitValue(nextValue) {
		if (disabled) return
		onChange(nextValue)
		closePopover({ restoreFocus: true })
	}

	function moveActive(delta) {
		if (!normalizedOptions.length) return

		let index = activeIndex
		for (let step = 0; step < normalizedOptions.length; step += 1) {
			index = (index + delta + normalizedOptions.length) % normalizedOptions.length
			if (!normalizedOptions[index]?.disabled) {
				setActiveIndex(index)
				return
			}
		}
	}

	useEffect(() => {
		if (!open) return

		function onPointerDown(event) {
			const target = event.target
			if (!(target instanceof Element)) return
			if (triggerRef.current?.contains(target)) return
			if (popoverRef.current?.contains(target)) return
			closePopover({ restoreFocus: false })
		}

		function onEscape(event) {
			if (event.key !== 'Escape') return
			event.preventDefault()
			closePopover({ restoreFocus: true })
		}

		document.addEventListener('pointerdown', onPointerDown)
		document.addEventListener('keydown', onEscape)
		return () => {
			document.removeEventListener('pointerdown', onPointerDown)
			document.removeEventListener('keydown', onEscape)
		}
	}, [open])

	return (
		<div className={`relative inline-flex ${className}`}>
			{/** Keep form compatibility */}
			{name ? <input type="hidden" name={name} value={value ?? ''} /> : null}

			<button
				id={id}
				type="button"
				ref={triggerRef}
				disabled={disabled}
				onClick={togglePopover}
				onKeyDown={(event) => {
					if (disabled) return
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault()
						togglePopover()
						return
					}

					if (event.key === 'ArrowDown') {
						event.preventDefault()
						if (!open) {
							openPopover()
							return
						}
						moveActive(1)
					}

					if (event.key === 'ArrowUp') {
						event.preventDefault()
						if (!open) {
							openPopover()
							return
						}
						moveActive(-1)
					}

					if (event.key === 'Escape' && open) {
						event.preventDefault()
						closePopover({ restoreFocus: false })
					}
				}}
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-controls={listboxId}
				aria-label={ariaLabel || label || 'Dropdown'}
				className={`group inline-flex h-10 min-w-48 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm transition-shadow duration-150 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
					disabled
						? 'cursor-not-allowed opacity-70'
						: 'cursor-pointer shadow-sm hover:shadow-md'
				}`}
			>
				{Icon ? <Icon className="shrink-0 text-base text-slate-500" /> : null}

				<div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-left">
					{label ? <span className="whitespace-nowrap text-xs text-slate-400">{label}:</span> : null}
					<span
						className={`truncate font-medium ${
							isPlaceholder ? 'text-slate-400' : 'text-slate-700'
						}`}
					>
						{selectedLabel}
					</span>
				</div>

				<FiChevronDown
					className={`ml-auto shrink-0 text-sm text-slate-400 transition-transform duration-150 ease-in-out ${
						open ? 'rotate-180' : ''
					}`}
				/>
			</button>

			{open ? (
				<div
					ref={popoverRef}
					className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
				>
					<div
						id={listboxId}
						role="listbox"
						aria-label={ariaLabel || label || 'Dropdown options'}
						tabIndex={-1}
						className="max-h-72 overflow-auto py-1"
						onKeyDown={(event) => {
							if (event.key === 'ArrowDown') {
								event.preventDefault()
								moveActive(1)
								return
							}

							if (event.key === 'ArrowUp') {
								event.preventDefault()
								moveActive(-1)
								return
							}

							if (event.key === 'Enter' && activeIndex >= 0) {
								event.preventDefault()
								const option = normalizedOptions[activeIndex]
								if (option && !option.disabled) {
									commitValue(option.value)
								}
								return
							}
						}}
					>
						{normalizedOptions.length ? (
							normalizedOptions.map((option, index) => {
								const selected =
									toComparableValue(option.value) === comparableValue
								const active = index === activeIndex
								const optionDisabled = Boolean(option.disabled)

								return (
									<button
										type="button"
										key={option.key}
										role="option"
										aria-selected={selected}
										disabled={optionDisabled}
										onMouseEnter={() => setActiveIndex(index)}
										onMouseDown={(event) => {
											// prevent focus leaving the trigger before we commit
											event.preventDefault()
										}}
										onClick={() => {
											if (optionDisabled) return
											commitValue(option.value)
										}}
										className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors ${
											optionDisabled
												? 'cursor-not-allowed text-slate-300'
												: active
													? 'bg-slate-50 text-slate-900'
													: 'text-slate-700 hover:bg-slate-50'
										} ${selected ? 'font-medium' : 'font-normal'}`}
									>
										<span className="min-w-0 flex-1 truncate">{option.label}</span>
										{selected ? (
											<span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
										) : null}
									</button>
								)
							})
						) : (
							<div className="px-3 py-2 text-sm text-slate-400">No options</div>
						)}
					</div>
				</div>
			) : null}
		</div>
	)
}
