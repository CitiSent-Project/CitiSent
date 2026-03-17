import { SettingToggleRow, SettingsSectionCard } from "../Account-Ui";
import { SettingsSelect } from "./SettingsSelect";

const digestOptions = [
  { label: "Daily", value: "Daily" },
  { label: "Weekly", value: "Weekly" },
  { label: "Monthly", value: "Monthly" },
];

export function NotificationSettingsTab({ preferences, onUpdatePreference }) {
  const notificationsEnabled = preferences?.notificationsEnabled ?? true;
  const reportStatusUpdates = preferences?.reportStatusUpdates ?? true;
  const adminInvitations = preferences?.adminInvitations ?? true;
  const digestFrequency = preferences?.digestFrequency ?? "Weekly";

  function handleNotificationsToggle(value) {
    onUpdatePreference("notificationsEnabled", value);
  }

  function handleReportUpdatesToggle(value) {
    onUpdatePreference("reportStatusUpdates", value);
  }

  function handleAdminInvitationsToggle(value) {
    onUpdatePreference("adminInvitations", value);
  }

  function handleDigestFrequencyChange(event) {
    onUpdatePreference("digestFrequency", event.target.value);
  }

  return (
    <SettingsSectionCard
      title="Notification preferences"
      description="Choose which updates you want to receive while managing reports."
    >
      <SettingToggleRow
        title="Enable notifications"
        description="Master switch for all incoming admin notifications."
        checked={notificationsEnabled}
        onChange={handleNotificationsToggle}
      />

      <SettingToggleRow
        title="Report status updates"
        description="Get alerts when a report status changes."
        checked={reportStatusUpdates}
        onChange={handleReportUpdatesToggle}
      />

      <SettingToggleRow
        title="Admin invitations"
        description="Receive notifications when admin invitations are created."
        checked={adminInvitations}
        onChange={handleAdminInvitationsToggle}
      />

      <SettingsSelect
        label="Digest frequency"
        value={digestFrequency}
        onChange={handleDigestFrequencyChange}
        options={digestOptions}
      />
    </SettingsSectionCard>
  );
}
