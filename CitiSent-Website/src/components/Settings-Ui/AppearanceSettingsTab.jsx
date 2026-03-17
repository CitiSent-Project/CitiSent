import { SettingToggleRow, SettingsSectionCard } from '../Account-Ui'
import { SettingsSelect } from './SettingsSelect'

const themeOptions = [
  { label: 'Light', value: 'Light' },
  { label: 'Dark', value: 'Dark' },
  { label: 'System', value: 'System' },
]

const fontSizeOptions = [
  { label: 'Small', value: 'Small' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Large', value: 'Large' },
]

export function AppearanceSettingsTab({ preferences, onUpdatePreference }) {
  return (
    <SettingsSectionCard title="Appearance" description="Set visual preferences for readability and comfort.">
      <div className="grid gap-4 md:grid-cols-2">
        <SettingsSelect
          label="Theme"
          value={preferences.theme}
          onChange={(event) => onUpdatePreference('theme', event.target.value)}
          options={themeOptions}
        />

        <SettingsSelect
          label="Font size"
          value={preferences.fontSize}
          onChange={(event) => onUpdatePreference('fontSize', event.target.value)}
          options={fontSizeOptions}
        />
      </div>

      <SettingToggleRow
        title="Enable animations"
        description="Keep page transitions and feedback animations active."
        checked={preferences.animationsEnabled}
        onChange={(value) => onUpdatePreference('animationsEnabled', value)}
      />
    </SettingsSectionCard>
  )
}
