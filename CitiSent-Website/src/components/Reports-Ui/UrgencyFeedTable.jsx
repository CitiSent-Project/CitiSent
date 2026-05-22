import { FiEye } from "react-icons/fi";
import { TableLoader } from '../ui/TableLoader'
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
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
      >
        <FiEye className="text-sm text-slate-500" />
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
    <div className="mb-4 rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-3">
      <div className="flex flex-wrap items-start gap-6">
        {/* Urgency Legend */}
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Urgency Level
          </p>
          <div className="flex flex-wrap gap-2">
            {URGENCY_LEGEND.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${item.color}`} />
                <span className="text-xs text-slate-300">
                  {item.label}
                  <span className="ml-0.5 text-slate-500">— {item.description}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Emotion Legend */}
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Emotion Level
          </p>
          <div className="flex flex-wrap gap-2">
            {EMOTION_LEGEND.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${item.color}`} />
                <span className="text-xs text-slate-300">{item.label}</span>
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
  const shouldShowLoader = isLoading && rows.length > 0

  if (!shouldShowLoader && rows.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-sm text-slate-400">
        No reports to display.
      </div>
    );
  }

  return (
    <div>
      <TableLegend />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3 w-24">ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3 hidden md:table-cell">Location</th>
              <th className="px-4 py-3">Emotion</th>
              <th className="px-4 py-3">Urgency</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 hidden lg:table-cell">Date</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <TableLoader
            isLoading={shouldShowLoader}
            delayMs={0}
            variant="refreshing"
            label="Refreshing reports..."
            refreshText="Refreshing reports..."
            rows={1}
            columns={8}
            cellClassName="h-4 w-24"
          />
          <tbody>
            {rows.map((row) => {
              const normalizedStatus = normalizeReportStatus(row.status);

              return (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-100"
                >
                  <td className="px-4 py-3 font-medium text-slate-700 font-numeric w-24" title={row.id}>
                    {truncateId(row.id)}
                  </td>
                  <td className="px-4 py-3 text-slate-800">{row.name}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-600">
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
                  <td className="px-4 py-3 hidden lg:table-cell text-slate-500 font-numeric">
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
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
