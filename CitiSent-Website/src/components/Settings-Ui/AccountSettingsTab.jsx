import { SettingsSectionCard } from "../Account-Ui";
import { FormInputField } from "./FormInputField";

export function AccountSettingsTab({
  profile,
  preferences,
  onUpdatePreference,
  onUpdateProfile,
}) {
  const displayName = preferences?.displayName ?? "";
  const department = preferences?.department ?? "";
  const email = profile?.email ?? "";
  const role = profile?.role ?? "";

  function handleDisplayNameChange(event) {
    onUpdatePreference("displayName", event.target.value);
  }

  function handleDepartmentChange(event) {
    const nextDepartment = event.target.value;
    onUpdatePreference("department", nextDepartment);
    onUpdateProfile({ department: nextDepartment });
  }

  return (
    <SettingsSectionCard
      title="Account settings"
      description="Control how your admin profile appears inside the dashboard."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormInputField
          label="Display name"
          value={displayName}
          onChange={handleDisplayNameChange}
        />

        <FormInputField
          label="Department"
          value={department}
          onChange={handleDepartmentChange}
        />

        <FormInputField
          label="Email (read-only)"
          value={email}
          disabled
        />

        <FormInputField
          label="Role (read-only)"
          value={role}
          disabled
        />
      </div>
    </SettingsSectionCard>
  );
}
