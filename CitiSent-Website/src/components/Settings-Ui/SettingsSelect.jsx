export function SettingsSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-slate-700">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
      >
        {options.map((option) => (
          <option key={String(option.value)} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
