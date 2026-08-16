import React, { useState, useMemo } from 'react';
import { FiDownload, FiCalendar, FiEye, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { TableLoader } from '../ui/TableLoader';
import { Pagination } from '../ui/Pagination';
import { useReportPaginationState } from '../../hooks/useReportPaginationState';
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_URGENCY_BADGE_CLASSES,
  normalizeReportStatus,
} from "../../models/reportStatusModel";

/**
 * ReportHistoryTable
 * 
 * Production-ready component for displaying resolved and rejected reports (Report History / Audit Log).
 * Provides month/year filtering, status filtering, pagination, and CSV export functionality for municipal reporting.
 */
export function ReportHistoryTable({ rows = [], onViewReport, isLoading = false, pageSize = 8 }) {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'resolved', 'rejected'

  // Filter history records based on month selection & status filter
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const normalizedStatus = normalizeReportStatus(row.status);
      
      // We only include historical records (Resolved or Unresolved)
      if (normalizedStatus !== 'Resolved' && normalizedStatus !== 'Unresolved') {
        return false;
      }

      if (statusFilter !== 'all') {
        if (statusFilter === 'resolved' && normalizedStatus !== 'Resolved') return false;
        if (statusFilter === 'rejected' && normalizedStatus !== 'Unresolved') return false;
      }

      if (selectedMonth && (row.resolvedAt || row.createdAt || row.date)) {
        const dateStr = row.resolvedAt || row.createdAt || row.date;
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
          const yearMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
          if (yearMonth !== selectedMonth) return false;
        }
      }

      return true;
    });
  }, [rows, selectedMonth, statusFilter]);

  const {
    totalPages,
    safeCurrentPage,
    visibleRows,
    visiblePages,
    handlePageChange,
    handleNextPage,
    handlePreviousPage,
  } = useReportPaginationState({ rows: filteredRows, pageSize });

  // Export filtered logs to CSV for municipal office record-keeping
  const exportToCSV = () => {
    if (filteredRows.length === 0) return;

    const headers = ["Report ID", "Reporter Name", "Location", "Issue Type", "Urgency", "Emotion", "Status", "Date Resolved / Logged"];
    const csvLines = [headers.join(",")];

    filteredRows.forEach((row) => {
      const line = [
        `"${row.reportNum || row.id}"`,
        `"${row.name || 'Anonymous'}"`,
        `"${row.location || ''}"`,
        `"${row.issueType || ''}"`,
        `"${row.urgency || ''}"`,
        `"${row.emotionLevel || 'Neutral'}"`,
        `"${normalizeReportStatus(row.status)}"`,
        `"${row.resolvedAt || row.date || ''}"`,
      ];
      csvLines.push(line.join(","));
    });

    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Sto_Tomas_Report_History_${selectedMonth || 'All'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shouldShowLoader = isLoading && rows.length > 0;

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Month Selector */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
            <FiCalendar className="text-slate-500 text-sm" />
            <span className="font-medium">Period:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-numeric focus:outline-none text-slate-800"
            />
            {selectedMonth && (
              <button
                type="button"
                onClick={() => setSelectedMonth('')}
                className="text-[10px] text-blue-600 hover:underline font-semibold ml-1"
              >
                Show All Dates
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded-md px-2.5 py-1 transition-colors ${statusFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              All History
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('resolved')}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors ${statusFilter === 'resolved' ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <FiCheckCircle className="text-emerald-500" />
              Resolved
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('rejected')}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors ${statusFilter === 'rejected' ? 'bg-rose-50 text-rose-700 font-semibold shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <FiXCircle className="text-rose-500" />
              Rejected
            </button>
          </div>
        </div>

        {/* Export Action Button */}
        <button
          type="button"
          onClick={exportToCSV}
          disabled={filteredRows.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiDownload className="text-sm" />
          Export CSV Report
        </button>
      </div>

      {/* History Feed Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3.5 w-28">Report #</th>
              <th className="px-4 py-3.5">Reporter</th>
              <th className="px-4 py-3.5 hidden md:table-cell">Location</th>
              <th className="px-4 py-3.5">Urgency</th>
              <th className="px-4 py-3.5">Outcome</th>
              <th className="px-4 py-3.5 hidden lg:table-cell">Date Logged</th>
              <th className="px-4 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <TableLoader
            isLoading={shouldShowLoader}
            delayMs={0}
            variant="refreshing"
            label="Loading history logs..."
            refreshText="Refreshing history logs..."
            rows={1}
            columns={7}
            cellClassName="h-4 w-24"
          />
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                  {selectedMonth ? `No historical reports found for ${selectedMonth}.` : "No historical reports found."}
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => {
                const normalizedStatus = normalizeReportStatus(row.status);

                return (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 transition-colors hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-3.5 font-medium text-slate-800 font-numeric w-28" title={row.reportNum || row.id}>
                      {row.reportNum || row.id?.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-800">{row.name || 'Citizen'}</td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-slate-600 max-w-xs truncate">
                      {row.location}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${REPORT_URGENCY_BADGE_CLASSES[row.urgency] || ""}`}
                      >
                        {row.urgency}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${REPORT_STATUS_BADGE_CLASSES[normalizedStatus] || ""}`}
                      >
                        {normalizedStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-slate-500 font-numeric text-xs">
                      {row.resolvedAt ? new Date(row.resolvedAt).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }) : (row.date || 'N/A')}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onViewReport?.(row)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <FiEye className="text-slate-500 text-xs" />
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Integrated Pagination Component */}
      {totalPages > 1 && (
        <div className="pt-2">
          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            visiblePages={visiblePages}
            onPageChange={handlePageChange}
            onNext={handleNextPage}
            onPrevious={handlePreviousPage}
          />
        </div>
      )}
    </div>
  );
}

