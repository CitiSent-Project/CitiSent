import { SettingsSectionCard } from "../Account-Ui";
import { FormInputField } from "./FormInputField";
import { USER_ROLES } from "../../models/roleAccessModel";

export function AccountSettingsTab({
  profile,
  preferences,
  onUpdatePreference,
}) {
  const displayName = preferences?.displayName ?? "";
  const department = preferences?.department ?? "";
  const email = profile?.email ?? "";
  const role = profile?.role ?? "";
  const isOfficeAdmin = role === USER_ROLES.OFFICE_ADMIN;

  function handleDisplayNameChange(event) {
    onUpdatePreference("displayName", event.target.value);
  }

  function handleDepartmentChange(event) {
    const nextDepartment = event.target.value;
    onUpdatePreference("department", nextDepartment);
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
          disabled={isOfficeAdmin}
        />

        {isOfficeAdmin ? (
          <p className="text-xs text-slate-500 md:col-span-2">
            Department changes require a transfer request in the Transfers tab.
          </p>
        ) : null}

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
