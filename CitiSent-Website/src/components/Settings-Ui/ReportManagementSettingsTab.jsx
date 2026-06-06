import { SettingToggleRow, SettingsSectionCard } from "../Account-Ui";
import { SettingsSelect } from "./SettingsSelect";

const reportsPerPageOptions = [
  { label: "6 reports", value: 6 },
  { label: "12 reports", value: 12 },
  { label: "24 reports", value: 24 },
];

const sortingOptions = [
  { label: "Latest first", value: "Latest first" },
  { label: "Oldest first", value: "Oldest first" },
  { label: "Highest urgency", value: "Highest urgency" },
];

export function ReportManagementSettingsTab({ preferences, onUpdatePreference }) {
  const reportsPerPage = preferences?.reportsPerPage ?? 6;
  const defaultSorting = preferences?.defaultSorting ?? "Latest first";
  const anonymousReports = preferences?.anonymousReports ?? true;
  const autoCloseReports = preferences?.autoCloseReports ?? false;

  function handleReportsPerPageChange(event) {
    onUpdatePreference("reportsPerPage", Number(event.target.value));
  }

  function handleDefaultSortingChange(event) {
    onUpdatePreference("defaultSorting", event.target.value);
  }

  function handleAnonymousReportsToggle(value) {
    onUpdatePreference("anonymousReports", value);
  }

  function handleAutoCloseReportsToggle(value) {
    onUpdatePreference("autoCloseReports", value);
  }

  return (
    <SettingsSectionCard
      title="Report Management"
      description="Set defaults for browsing and handling report records."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <SettingsSelect
          label="Reports per page"
          value={reportsPerPage}
          onChange={handleReportsPerPageChange}
          options={reportsPerPageOptions}
        />

        <SettingsSelect
          label="Default sorting"
          value={defaultSorting}
          onChange={handleDefaultSortingChange}
          options={sortingOptions}
        />
      </div>

      <SettingToggleRow
        title="Anonymous reports"
        description="Allow reports without a visible reporter name in report lists."
        checked={anonymousReports}
        onChange={handleAnonymousReportsToggle}
      />

      <SettingToggleRow
        title="Auto-close reports"
        description="Keep this off unless report closure rules are approved by your team."
        checked={autoCloseReports}
        onChange={handleAutoCloseReportsToggle}
      />
    </SettingsSectionCard>
  );
}
