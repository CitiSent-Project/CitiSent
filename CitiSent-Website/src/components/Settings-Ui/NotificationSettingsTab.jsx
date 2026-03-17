import { SettingToggleRow, SettingsSectionCard } from '../Account-Ui'
import { SettingsSelect } from './SettingsSelect'

const digestOptions = [
  { label: 'Daily', value: 'Daily' },
  { label: 'Weekly', value: 'Weekly' },
  { label: 'Monthly', value: 'Monthly' },
]

export function NotificationSettingsTab({ preferences, onUpdatePreference }) {
  return (
    <SettingsSectionCard
      title="Notification preferences"
      description="Choose which updates you want to receive while managing reports."
    >
      <SettingToggleRow
        title="Enable notifications"
        description="Master switch for all incoming admin notifications."
        checked={preferences.notificationsEnabled}
        onChange={(value) => onUpdatePreference('notificationsEnabled', value)}
      />

      <SettingToggleRow
        title="Report status updates"
        description="Get alerts when a report status changes."
        checked={preferences.reportStatusUpdates}
        onChange={(value) => onUpdatePreference('reportStatusUpdates', value)}
      />

      <SettingToggleRow
        title="Admin invitations"
        description="Receive notifications when admin invitations are created."
        checked={preferences.adminInvitations}
        onChange={(value) => onUpdatePreference('adminInvitations', value)}
      />

      <SettingsSelect
        label="Digest frequency"
        value={preferences.digestFrequency}
        onChange={(event) => onUpdatePreference('digestFrequency', event.target.value)}
        options={digestOptions}
      />
    </SettingsSectionCard>
  )
}
