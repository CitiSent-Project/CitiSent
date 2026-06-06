import { SettingToggleRow, SettingsSectionCard } from "../Account-Ui";

export function NotificationSettingsTab({ preferences, onUpdatePreference }) {
  const newReports = preferences?.newReports ?? true;
  const escalatedReports = preferences?.escalatedReports ?? true;
  const summaryEmails = preferences?.summaryEmails ?? false;

  function handleNewReportsToggle(value) {
    onUpdatePreference("newReports", value);
  }

  function handleEscalatedReportsToggle(value) {
    onUpdatePreference("escalatedReports", value);
  }

  function handleSummaryEmailsToggle(value) {
    onUpdatePreference("summaryEmails", value);
  }

  return (
    <SettingsSectionCard
      title="Notifications"
      description="Choose which report updates should reach you while managing the portal."
    >
      <SettingToggleRow
        title="New reports"
        description="Receive an alert when a citizen submits a new report."
        checked={newReports}
        onChange={handleNewReportsToggle}
      />

      <SettingToggleRow
        title="Escalated reports"
        description="Receive alerts for high-priority or escalated report activity."
        checked={escalatedReports}
        onChange={handleEscalatedReportsToggle}
      />

      <SettingToggleRow
        title="Summary emails"
        description="Send periodic report summaries to your admin email."
        checked={summaryEmails}
        onChange={handleSummaryEmailsToggle}
      />
    </SettingsSectionCard>
  );
}
