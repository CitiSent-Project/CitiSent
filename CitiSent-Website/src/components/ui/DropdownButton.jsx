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
	const normalizedOptions = options.map((option, index) => normalizeOption(option, index))
	const comparableValue = toComparableValue(value)

	const selectedOption =
		normalizedOptions.find((option) => toComparableValue(option.value) === comparableValue) || null

	const selectedLabel = selectedOption
		? String(selectedOption.label ?? '')
		: comparableValue
			? String(value)
			: placeholder

	return (
		<div
			className={`relative inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 transition-colors hover:bg-slate-50 focus-within:border-blue-300 focus-within:bg-slate-50 focus-within:ring-2 focus-within:ring-blue-100 ${
				disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
			} ${className}`}
		>
			{Icon ? <Icon className="shrink-0 text-sm text-slate-500" /> : null}

			<div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
				{label ? <span className="whitespace-nowrap">{label}:</span> : null}
				<span className="truncate font-medium text-slate-700">{selectedLabel}</span>
			</div>

			<FiChevronDown className="ml-auto shrink-0 text-sm text-slate-500" />

			<select
				id={id}
				name={name}
				value={value ?? ''}
				onChange={(event) => onChange(event.target.value)}
				disabled={disabled}
				aria-label={ariaLabel || label || 'Dropdown'}
				className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
			>
				{normalizedOptions.map((option) => (
					<option key={option.key} value={option.value} disabled={option.disabled}>
						{option.label}
					</option>
				))}
			</select>
		</div>
	)
}
