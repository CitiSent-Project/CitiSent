import { SettingToggleRow, SettingsSectionCard } from "../Account-Ui";
import { SettingsSelect } from "./SettingsSelect";

const themeOptions = [
  { label: "Light", value: "Light" },
  { label: "Dark", value: "Dark" },
  { label: "System", value: "System" },
];

const fontSizeOptions = [
  { label: "Small", value: "Small" },
  { label: "Medium", value: "Medium" },
  { label: "Large", value: "Large" },
];

export function AppearanceSettingsTab({ preferences, onUpdatePreference }) {
  const theme = preferences?.theme ?? "System";
  const fontSize = preferences?.fontSize ?? "Medium";
  const animationsEnabled = preferences?.animationsEnabled ?? true;

  function handleThemeChange(event) {
    onUpdatePreference("theme", event.target.value);
  }

  function handleFontSizeChange(event) {
    onUpdatePreference("fontSize", event.target.value);
  }

  function handleAnimationsToggle(value) {
    onUpdatePreference("animationsEnabled", value);
  }

  return (
    <SettingsSectionCard
      title="Appearance"
      description="Set visual preferences for readability and comfort."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <SettingsSelect
          label="Theme"
          value={theme}
          onChange={handleThemeChange}
          options={themeOptions}
        />

        <SettingsSelect
          label="Font size"
          value={fontSize}
          onChange={handleFontSizeChange}
          options={fontSizeOptions}
        />
      </div>

      <SettingToggleRow
        title="Enable animations"
        description="Keep page transitions and feedback animations active."
        checked={animationsEnabled}
        onChange={handleAnimationsToggle}
      />
    </SettingsSectionCard>
  );
}
