export function SettingToggleRow({ title, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-slate-800">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          checked ? 'bg-blue-900' : 'bg-slate-300'
        }`}
        aria-label={title}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
            checked ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}
