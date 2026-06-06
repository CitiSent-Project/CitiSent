import { SettingsSectionCard } from "../Account-Ui";
import { SettingsSelect } from "./SettingsSelect";

const timezoneOptions = [
  { label: "Asia/Manila", value: "Asia/Manila" },
  { label: "UTC", value: "UTC" },
  { label: "America/Los_Angeles", value: "America/Los_Angeles" },
  { label: "America/New_York", value: "America/New_York" },
];

export function SystemSettingsTab({
  activityLog = [],
  preferences,
  onUpdatePreference,
  onOpenActivityLogs,
}) {
  const timezone = preferences?.timezone ?? "Asia/Manila";

  function handleTimezoneChange(event) {
    onUpdatePreference("timezone", event.target.value);
  }

  return (
    <SettingsSectionCard
      title="System"
      description="Review system-level display preferences without changing app branding."
    >
      <SettingsSelect
        label="Timezone"
        value={timezone}
        onChange={handleTimezoneChange}
        options={timezoneOptions}
      />

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-medium text-slate-800">Activity logs</p>
        <p className="mt-1 text-xs text-slate-500">
          {activityLog.length} activity log entries are available in Audit & Logs.
        </p>
        <button
          type="button"
          onClick={onOpenActivityLogs}
          className="mt-3 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Open activity logs
        </button>
      </div>
    </SettingsSectionCard>
  );
}
