import { DropdownButton } from '../ui/DropdownButton'

export function SettingsSelect({ label, value, onChange, options }) {
  function handleChange(nextValue) {
    onChange({ target: { value: nextValue } })
  }

  return (
    <div>
      <label className="mb-1 block text-sm text-slate-700">{label}</label>
      <DropdownButton
        className="w-full"
        ariaLabel={label}
        value={value}
        onChange={handleChange}
        options={options}
      />
    </div>
  )
}
