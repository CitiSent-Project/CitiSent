import { SettingsSectionCard } from '../Account-Ui'
import { FormInputField } from './FormInputField'

export function AccountSettingsTab({ profile, preferences, onUpdatePreference, onUpdateProfile }) {
  return (
    <SettingsSectionCard
      title="Account settings"
      description="Control how your admin profile appears inside the dashboard."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormInputField
          label="Display name"
          value={preferences.displayName}
          onChange={(event) => onUpdatePreference('displayName', event.target.value)}
        />

        <FormInputField
          label="Department"
          value={preferences.department}
          onChange={(event) => {
            onUpdatePreference('department', event.target.value)
            onUpdateProfile({ department: event.target.value })
          }}
        />

        <FormInputField label="Email (read-only)" value={profile.email} disabled />

        <FormInputField label="Role (read-only)" value={profile.role} disabled />
      </div>
    </SettingsSectionCard>
  )
}
