import { SettingsSectionCard } from '../Account-Ui'
import { SettingsSelect } from './SettingsSelect'

const timeoutOptions = [
  { label: '5 minutes', value: 5 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '60 minutes', value: 60 },
]

export function SecuritySettingsTab({ preferences, onUpdatePreference, onRequestLogout }) {
  return (
    <SettingsSectionCard
      title="Security and session"
      description="Set timeout rules and manage active account sessions."
    >
      <SettingsSelect
        label="Session timeout"
        value={preferences.sessionTimeout}
        onChange={(event) => onUpdatePreference('sessionTimeout', Number(event.target.value))}
        options={timeoutOptions}
      />

      <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
        <p className="text-sm font-medium text-rose-700">Security action</p>
        <p className="mt-1 text-xs text-rose-600">For demo purposes, sign out and return to the login screen.</p>
        <button
          type="button"
          onClick={onRequestLogout}
          className="mt-3 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-500"
        >
          Sign out now
        </button>
      </div>
    </SettingsSectionCard>
  )
}
