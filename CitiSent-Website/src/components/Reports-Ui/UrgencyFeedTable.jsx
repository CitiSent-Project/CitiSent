import { FiEye } from "react-icons/fi";
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_URGENCY_BADGE_CLASSES,
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

export function UrgencyFeedTable({ rows = [], onViewReport }) {
  if (rows.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-sm text-slate-400">
        No reports to display.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3 hidden md:table-cell">Location</th>
            <th className="px-4 py-3">Urgency</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 hidden lg:table-cell">Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const normalizedStatus = normalizeReportStatus(row.status);

            return (
              <tr
                key={row.id}
                className="border-b border-slate-100 transition-colors hover:bg-slate-100"
              >
                <td className="px-4 py-3 font-medium text-slate-700 font-numeric">
                  {row.id}
                </td>
                <td className="px-4 py-3 text-slate-800">{row.name}</td>
                <td className="px-4 py-3 hidden md:table-cell text-slate-600">
                  {row.location}
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
  );
}
