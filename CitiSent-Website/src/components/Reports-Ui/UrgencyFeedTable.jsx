import { FiEye } from "react-icons/fi";
import { TableLoader } from '../ui/TableLoader'
import { Spinner } from '../ui/Spinner'
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_URGENCY_BADGE_CLASSES,
  REPORT_EMOTION_BADGE_CLASSES,
  normalizeReportStatus,
} from "../../models/reportStatusModel";

function ActionMenu({ report, onViewReport }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onViewReport?.(report)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        <FiEye className="text-sm text-slate-500 dark:text-slate-400" />
        View
      </button>
    </div>
  );
}

const URGENCY_LEGEND = [
  { label: "Critical", color: "bg-red-500", description: "Life-threatening" },
  { label: "High", color: "bg-orange-500", description: "Serious issue" },
  { label: "Medium", color: "bg-yellow-500", description: "Maintenance" },
  { label: "Low", color: "bg-emerald-500", description: "Suggestion" },
];

const EMOTION_LEGEND = [
  { label: "Sad", color: "bg-blue-500" },
  { label: "Happy", color: "bg-emerald-500" },
  { label: "Frustrated", color: "bg-orange-500" },
  { label: "Angry", color: "bg-red-500" },
  { label: "Disappointed", color: "bg-purple-500" },
  { label: "Excited", color: "bg-yellow-500" },
  { label: "Delighted", color: "bg-teal-500" },
  { label: "Neutral", color: "bg-slate-500" },
];

function TableLegend() {
  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800/80">
      <div className="flex flex-wrap items-start gap-6">
        {/* Urgency Legend */}
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Urgency Level
          </p>
          <div className="flex flex-wrap gap-2">
            {URGENCY_LEGEND.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${item.color}`} />
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  {item.label}
                  <span className="ml-0.5 text-slate-500 dark:text-slate-400">— {item.description}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Emotion Legend */}
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Emotion Status
          </p>
          <div className="flex flex-wrap gap-2">
            {EMOTION_LEGEND.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${item.color}`} />
                <span className="text-xs text-slate-700 dark:text-slate-300">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function truncateId(id) {
  if (!id) return '';
  const str = String(id);
  return str.length > 8 ? `${str.slice(0, 8)}…` : str;
}

export function UrgencyFeedTable({ rows = [], onViewReport, isLoading = false }) {
  const isInitialLoading = isLoading && rows.length === 0;
  const isRefreshing = isLoading && rows.length > 0;

  return (
    <div>
      <TableLegend />
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <th className="px-4 py-3 w-24">ID</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3 hidden md:table-cell">Location</th>
              <th className="px-4 py-3">Emotion</th>
              <th className="px-4 py-3">Urgency</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 hidden lg:table-cell">Date</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <TableLoader
            isLoading={isRefreshing}
            delayMs={0}
            variant="refreshing"
            label="Refreshing reports..."
            refreshText="Refreshing reports..."
            rows={1}
            columns={8}
            cellClassName="h-4 w-24"
          />
          <TableLoader
            isLoading={isInitialLoading}
            delayMs={0}
            minDisplayMs={0}
            variant="skeleton"
            label="Loading reports..."
            rows={5}
            columns={8}
            cellClassName="h-4 w-24"
          />
          {!isInitialLoading && (
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                    No reports to display.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const normalizedStatus = normalizeReportStatus(row.status);

              return (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-100 dark:border-slate-700/60 dark:hover:bg-slate-700/40"
                >
                  <td className="px-4 py-3 font-medium text-slate-700 font-numeric w-24 dark:text-slate-200" title={row.reportNum || row.id}>
                    {row.reportNum || truncateId(row.id)}
                  </td>
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-100">{row.email || "N/A"}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-600 dark:text-slate-300">
                    {row.location}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${REPORT_EMOTION_BADGE_CLASSES[row.emotionLevel] || "bg-slate-500/20 text-slate-400 border border-slate-500/30"}`}
                    >
                      {row.emotionLevel || 'Neutral'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${REPORT_URGENCY_BADGE_CLASSES[row.urgency] || ""}`}
                    >
                      {row.urgency}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${REPORT_STATUS_BADGE_CLASSES[normalizedStatus] || ""}`}
                    >
                      {normalizedStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-slate-500 font-numeric dark:text-slate-400">
                    {row.date}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ActionMenu
                      report={row}
                      onViewReport={onViewReport}
                    />
                  </td>
                </tr>
              );
            })
          )}
          </tbody>
          )}
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="block md:hidden space-y-3 mt-4" aria-busy={isLoading} aria-live="polite" role={isLoading ? 'status' : undefined}>
        {isLoading && <span className="sr-only">Loading reports...</span>}
        {isRefreshing && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-500 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-slate-400">
            <span>Refreshing reports...</span>
            <div aria-hidden="true" className="h-2 w-16 animate-shimmer rounded-full bg-slate-200/80 dark:bg-slate-700/80" />
          </div>
        )}
        {isInitialLoading && (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-700 dark:bg-slate-800"
              aria-hidden="true"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-5 w-20 animate-shimmer rounded bg-slate-200/80 dark:bg-slate-700/80" />
                  <div className="h-4 w-36 animate-shimmer rounded-md bg-slate-200/80 dark:bg-slate-700/80" />
                  <div className="h-3 w-48 max-w-full animate-shimmer rounded bg-slate-200/80 dark:bg-slate-700/80" />
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="h-5 w-18 animate-shimmer rounded-full bg-slate-200/80 dark:bg-slate-700/80" />
                  <div className="h-5 w-14 animate-shimmer rounded-full bg-slate-200/80 dark:bg-slate-700/80" />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-700/50">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-16 animate-shimmer rounded-full bg-slate-200/80 dark:bg-slate-700/80" />
                  <div className="h-3 w-20 animate-shimmer rounded bg-slate-200/80 dark:bg-slate-700/80" />
                </div>
                <div className="h-7 w-18 animate-shimmer rounded-lg bg-slate-200/80 dark:bg-slate-700/80" />
              </div>
            </div>
          ))
        )}
        {!isInitialLoading && rows.length === 0 && (
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-8 text-center shadow-2xs dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">No reports to display.</p>
          </div>
        )}
        {!isInitialLoading && rows.length > 0 && (
          rows.map((row) => {
            const normalizedStatus = normalizeReportStatus(row.status);

            return (
              <div key={row.id} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="inline-block rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-medium text-slate-700 border border-slate-200/60 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200">
                      {row.reportNum || truncateId(row.id)}
                    </span>
                    <p className="mt-1.5 font-semibold text-slate-900 text-sm truncate dark:text-white">{row.email || "N/A"}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500 truncate dark:text-slate-400">{row.location}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${REPORT_STATUS_BADGE_CLASSES[normalizedStatus] || ""}`}>
                      {normalizedStatus}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${REPORT_URGENCY_BADGE_CLASSES[row.urgency] || ""}`}>
                      {row.urgency}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 gap-2 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${REPORT_EMOTION_BADGE_CLASSES[row.emotionLevel] || "bg-slate-500/20 text-slate-400 border border-slate-500/30"}`}>
                      {row.emotionLevel || 'Neutral'}
                    </span>
                    <p className="text-[11px] text-slate-400 font-numeric dark:text-slate-500">
                      {row.date}
                    </p>
                  </div>
                  <ActionMenu
                    report={row}
                    onViewReport={onViewReport}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  );
}
