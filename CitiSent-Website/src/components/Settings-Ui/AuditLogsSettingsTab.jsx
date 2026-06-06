import { SettingToggleRow, SettingsSectionCard } from "../Account-Ui";
import { formatDateTime } from "../../models/data";

function escapeCsvValue(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function buildActivityCsv(activityLog = []) {
  const header = ["Action", "Detail", "Created At"];
  const rows = activityLog.map((entry) => [
    entry.action,
    entry.detail,
    entry.createdAt,
  ]);

  return [header, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");
}

export function AuditLogsSettingsTab({ activityLog = [], preferences, onUpdatePreference }) {
  const auditTrackingEnabled = preferences?.auditTrackingEnabled ?? true;
  const visibleEntries = activityLog.slice(0, 8);
  const hasLogs = activityLog.length > 0;

  function handleAuditTrackingToggle(value) {
    onUpdatePreference("auditTrackingEnabled", value);
  }

  function handleDownloadLogs() {
    if (!hasLogs) {
      return;
    }

    const csv = buildActivityCsv(activityLog);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `citisent-activity-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <SettingsSectionCard
      title="Audit & Logs"
      description="Review recent activity and control client-side audit tracking."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-800">View activity logs</p>
          <p className="text-xs text-slate-500">
            Showing the latest {visibleEntries.length} of {activityLog.length} saved entries.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownloadLogs}
          disabled={!hasLogs}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
            hasLogs
              ? "bg-blue-900 text-white hover:bg-slate-800"
              : "border border-slate-300 bg-slate-100 text-slate-400"
          }`}
        >
          Download logs
        </button>
      </div>

      <div className="space-y-2">
        {hasLogs ? (
          visibleEntries.map((entry) => (
            <article
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">{entry.action}</p>
                <p className="text-xs text-slate-500">{entry.detail}</p>
              </div>
              <span className="text-xs text-slate-500">{formatDateTime(entry.createdAt)}</span>
            </article>
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-slate-300 px-3 py-5 text-sm text-slate-500">
            Activity will appear here as you use the admin portal.
          </p>
        )}
      </div>

      <SettingToggleRow
        title="Enable audit tracking"
        description="Record future client-side activity in the local activity log."
        checked={auditTrackingEnabled}
        onChange={handleAuditTrackingToggle}
      />
    </SettingsSectionCard>
  );
}
