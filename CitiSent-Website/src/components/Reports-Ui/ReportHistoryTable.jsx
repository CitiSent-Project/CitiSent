import React, { useState, useMemo } from 'react';
import { FiDownload, FiCalendar, FiEye, FiCheckCircle, FiXCircle, FiGrid, FiSmile, FiAlertTriangle } from "react-icons/fi";
import { TableLoader } from '../ui/TableLoader';
import { Pagination } from '../ui/Pagination';
import { useReportPaginationState } from '../../hooks/reports/useReportPaginationState';
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_URGENCY_BADGE_CLASSES,
  REPORT_EMOTION_BADGE_CLASSES,
  REPORT_EMOTION_OPTIONS,
  normalizeReportStatus,
} from "../../models/reportStatusModel";

function formatReportId(reportNum, id) {
  const value = String(reportNum || id || '').trim()
  if (!value) return 'N/A'
  return value.length > 12 ? `${value.slice(0, 8)}…` : value
}

const URGENCY_OPTIONS = ['All Urgencies', 'Critical', 'High', 'Medium', 'Low'];
const EMOTION_OPTIONS = ['All Emotions', ...REPORT_EMOTION_OPTIONS];

/**
 * ReportHistoryTable
 * 
 * Production-ready component for displaying resolved and rejected reports (Report History / Audit Log).
 * Provides month/year filtering, status filtering, pagination, and CSV export functionality for municipal reporting.
 */
export function ReportHistoryTable({
  rows = [],
  departmentOptions = [],
  onViewReport,
  isLoading = false,
  pageSize = 8,
}) {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'resolved', 'rejected'
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [emotionFilter, setEmotionFilter] = useState('All');
  const [urgencyFilter, setUrgencyFilter] = useState('All');

  // Derive department list from passed options or rows
  const availableDepartments = useMemo(() => {
    const list = new Set();
    departmentOptions.forEach((dept) => {
      const label = dept?.label || dept?.name || dept;
      if (label) list.add(String(label).trim());
    });
    rows.forEach((row) => {
      const cat = row?.category || row?.issueType || row?.department;
      if (cat) list.add(String(cat).trim());
    });
    return ['All Departments', ...Array.from(list)];
  }, [departmentOptions, rows]);

  // Filter history records based on month selection & all filter controls
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const normalizedStatus = normalizeReportStatus(row.status);
      
      // We only include historical records (Resolved or Unresolved)
      if (normalizedStatus !== 'Resolved' && normalizedStatus !== 'Unresolved') {
        return false;
      }

      // Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'resolved' && normalizedStatus !== 'Resolved') return false;
        if (statusFilter === 'rejected' && normalizedStatus !== 'Unresolved') return false;
      }

      // Department Filter
      if (departmentFilter !== 'All' && departmentFilter !== 'All Departments') {
        const rowDept = String(row.category || row.issueType || row.department || '').trim();
        if (rowDept !== departmentFilter) return false;
      }

      // Urgency Filter
      if (urgencyFilter !== 'All' && urgencyFilter !== 'All Urgencies') {
        if (row.urgency !== urgencyFilter) return false;
      }

      // Emotion Filter
      if (emotionFilter !== 'All' && emotionFilter !== 'All Emotions') {
        const rowEmotion = row.emotionLevel || 'Neutral';
        if (rowEmotion !== emotionFilter) return false;
      }

      // Date / Month Filter
      if (selectedMonth && (row.resolvedAt || row.createdAt || row.date)) {
        const dateStr = row.resolvedAt || row.createdAt || row.date;
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
          const yearMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
          if (yearMonth !== selectedMonth) return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.resolvedAt || a.createdAt || a.date || 0).getTime();
      const dateB = new Date(b.resolvedAt || b.createdAt || b.date || 0).getTime();
      return dateB - dateA; // latest first
    });
  }, [rows, selectedMonth, statusFilter, departmentFilter, urgencyFilter, emotionFilter]);

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

    const headers = ["Report ID", "Reporter Name", "Location", "Department / Issue Type", "Urgency", "Emotion", "Status", "Date Resolved / Logged"];
    const csvLines = [headers.join(",")];

    filteredRows.forEach((row) => {
      const line = [
        `"${row.reportNum || row.id}"`,
        `"${row.name || 'Anonymous'}"`,
        `"${row.location || ''}"`,
        `"${row.category || row.issueType || ''}"`,
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

  const isInitialLoading = isLoading && rows.length === 0;
  const isRefreshing = isLoading && rows.length > 0;

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
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
                Reset
              </button>
            )}
          </div>

          {/* Status Filter Group */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded-md px-2.5 py-1 transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All History
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('resolved')}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors ${
                statusFilter === 'resolved'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-emerald-600'
              }`}
            >
              <FiCheckCircle className={statusFilter === 'resolved' ? 'text-white' : 'text-emerald-500'} />
              Resolved
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('rejected')}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors ${
                statusFilter === 'rejected'
                  ? 'bg-rose-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-rose-600'
              }`}
            >
              <FiXCircle className={statusFilter === 'rejected' ? 'text-white' : 'text-rose-500'} />
              Rejected
            </button>
          </div>

          {/* 3 Categorization Filter Buttons: Department, Emotion, Urgency */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Department Filter Button */}
            <div className="relative flex items-center w-full sm:w-auto">
              <FiGrid className="pointer-events-none absolute left-3 text-sm text-blue-500 z-10" />
              <select
                aria-label="Filter by department"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full sm:w-auto appearance-none rounded-lg border border-slate-300 bg-slate-100 py-1.5 pl-8 pr-7 text-xs font-medium text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors shadow-xs"
              >
                {availableDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept === 'All Departments' ? 'Department: All' : dept}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2.5 text-[10px] text-slate-400">▼</span>
            </div>

            {/* Emotion Status Filter Button */}
            <div className="relative flex items-center w-full sm:w-auto">
              <FiSmile className="pointer-events-none absolute left-3 text-sm text-amber-500 z-10" />
              <select
                aria-label="Filter by emotional status"
                value={emotionFilter}
                onChange={(e) => setEmotionFilter(e.target.value)}
                className="w-full sm:w-auto appearance-none rounded-lg border border-slate-300 bg-slate-100 py-1.5 pl-8 pr-7 text-xs font-medium text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors shadow-xs"
              >
                {EMOTION_OPTIONS.map((emotion) => (
                  <option key={emotion} value={emotion}>
                    {emotion === 'All Emotions' ? 'Emotion: All' : emotion}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2.5 text-[10px] text-slate-400">▼</span>
            </div>

            {/* Urgency Level Filter Button */}
            <div className="relative flex items-center w-full sm:w-auto">
              <FiAlertTriangle className="pointer-events-none absolute left-3 text-sm text-rose-500 z-10" />
              <select
                aria-label="Filter by urgency level"
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
                className="w-full sm:w-auto appearance-none rounded-lg border border-slate-300 bg-slate-100 py-1.5 pl-8 pr-7 text-xs font-medium text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors shadow-xs"
              >
                {URGENCY_OPTIONS.map((urgency) => (
                  <option key={urgency} value={urgency}>
                    {urgency === 'All Urgencies' ? 'Urgency: All' : urgency}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2.5 text-[10px] text-slate-400">▼</span>
            </div>
          </div>
        </div>

        {/* Export Action Button */}
        <button
          type="button"
          onClick={exportToCSV}
          disabled={filteredRows.length === 0}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm lg:w-auto lg:shrink-0"
        >
          <FiDownload className="text-sm" />
          Export CSV Report
        </button>
      </div>

      {/* History Feed Table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3.5 w-32">Report #</th>
              <th className="px-4 py-3.5">Reporter</th>
              <th className="px-4 py-3.5 hidden md:table-cell">Location</th>
              <th className="px-4 py-3.5">Urgency</th>
              <th className="px-4 py-3.5">Outcome</th>
              <th className="px-4 py-3.5 hidden lg:table-cell">Date Logged</th>
              <th className="px-4 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <TableLoader
            isLoading={isRefreshing}
            delayMs={0}
            variant="refreshing"
            label="Loading history logs..."
            refreshText="Refreshing history logs..."
            rows={1}
            columns={7}
            cellClassName="h-4 w-24"
          />
          <TableLoader
            isLoading={isInitialLoading}
            delayMs={0}
            minDisplayMs={0}
            variant="skeleton"
            label="Loading history logs..."
            rows={5}
            columns={7}
            cellClassName="h-4 w-24"
          />
          {!isInitialLoading && (
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
                const rawId = row.reportNum || row.id || '';
                const displayId = formatReportId(row.reportNum, row.id);

                return (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                  >
                    <td className="px-4 py-3.5 font-medium text-slate-800 font-numeric w-32" title={rawId}>
                      <span className="inline-block rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-medium text-slate-700">
                        {displayId}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-800 font-medium">{row.name || 'Citizen'}</td>
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
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-xs theme-dark-btn-outline"
                      >
                        <FiEye className="text-xs" />
                        Details
                      </button>
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
      <div className="block md:hidden space-y-3">
        {isInitialLoading && (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-32 w-full animate-pulse rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm" />
          ))
        )}
        {!isInitialLoading && visibleRows.length === 0 && (
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-8 text-center shadow-2xs">
            <p className="text-sm text-slate-500">
              {selectedMonth ? `No historical reports found for ${selectedMonth}.` : "No historical reports found."}
            </p>
          </div>
        )}
        {!isInitialLoading && visibleRows.length > 0 && (
          visibleRows.map((row) => {
            const normalizedStatus = normalizeReportStatus(row.status);
            const displayId = formatReportId(row.reportNum, row.id);

            return (
              <div key={row.id} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs transition hover:border-slate-300">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="inline-block rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-medium text-slate-700 border border-slate-200/60">
                      {displayId}
                    </span>
                    <p className="mt-1.5 font-semibold text-slate-900 text-sm truncate">{row.name || 'Citizen'}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500 truncate">{row.location}</p>
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

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <p className="text-[11px] text-slate-400 font-numeric">
                    {row.resolvedAt ? new Date(row.resolvedAt).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }) : (row.date || 'N/A')}
                  </p>
                  <button
                    type="button"
                    onClick={() => onViewReport?.(row)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
                  >
                    <FiEye className="text-xs" />
                    Details
                  </button>
                </div>
              </div>
            )
          })
        )}
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

