export function FormInputField({ label, value, onChange, disabled = false, type = 'text' }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none ${
          disabled ? 'bg-slate-100 text-slate-500' : 'text-slate-700'
        }`}
      />
    </div>
  )
}
