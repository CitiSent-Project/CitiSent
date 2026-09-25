import React, { useState, useEffect } from "react";
import { opsApiClient } from "../services/opsApiClient";
import { Button } from "./common/Button";
import { Badge } from "./common/Badge";
import { CopyButton } from "./common/CopyButton";
import { TableSkeleton } from "./common/TableSkeleton";
import { useToast } from "../context/ToastContext";
import {
  IoListOutline,
  IoRefresh,
  IoFilterOutline,
  IoCloseCircleOutline,
} from "react-icons/io5";

const KNOWN_ACTIONS = [
  { value: "", label: "All Action Types" },
  { value: "PROVISION_SUPERADMIN", label: "Provision Superadmin" },
  { value: "RESEND_INVITE_SUPERADMIN", label: "Resend Invitation" },
  { value: "UNLOCK_SUPERADMIN", label: "Unlock Security Lockout" },
  { value: "STATUS_UPDATE_SUPERADMIN", label: "Status Update" },
  { value: "SEED_DEPARTMENTS", label: "Seed Departments" },
  { value: "DEVELOPER_REGISTER", label: "Developer Bootstrap" },
];

/**
 * AuditLogViewer Component
 *
 * Immutable chronological audit stream of all high-privilege control plane actions:
 * - Server-side parameterized filtering by Action Type, Start Date, and End Date
 * - JSON payload inspection with one-click clipboard copying
 * - TableSkeleton loaders during query execution
 */
export function AuditLogViewer() {
  const { showToast } = useToast();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // Filter criteria state
  const [actionType, setActionType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  async function loadLogs() {
    try {
      setLoading(true);
      const params = {};
      if (actionType) params.actionType = actionType;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await opsApiClient.getAuditLogs(params);
      if (res.success) {
        setLogs(res.data || []);
      }
    } catch (err) {
      showToast({
        type: "error",
        title: "Audit Query Failed",
        message: err.message || "Failed to load audit trail records.",
      });
    } finally {
      setLoading(false);
    }
  }

  // Reload logs when filters change
  useEffect(() => {
    loadLogs();
  }, [actionType, startDate, endDate]);

  function handleClearFilters() {
    setActionType("");
    setStartDate("");
    setEndDate("");
  }

  function formatActionBadge(action) {
    if (!action) return <Badge variant="default">UNKNOWN</Badge>;
    if (action.includes("PROVISION") || action.includes("SEED")) {
      return <Badge variant="active">{action}</Badge>;
    }
    if (action.includes("UNLOCK")) {
      return <Badge variant="info">{action}</Badge>;
    }
    if (action.includes("SUSPEND")) {
      return <Badge variant="suspended">{action}</Badge>;
    }
    return <Badge variant="default">{action}</Badge>;
  }

  const hasActiveFilters = Boolean(actionType || startDate || endDate);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <IoListOutline className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Platform Audit Trail
            </h3>
            <p className="text-xs text-slate-400">
              Immutable log of all developer and commissioning actions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <IoCloseCircleOutline className="w-4 h-4 text-rose-400" />
              Clear Filters
            </button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={loadLogs}
            disabled={loading}
          >
            <IoRefresh className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-medium">
          <IoFilterOutline className="w-4 h-4 text-cyan-400" />
          <span>Filters:</span>
        </div>

        {/* Action Type Selector */}
        <select
          value={actionType}
          onChange={(e) => setActionType(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none transition-colors cursor-pointer"
        >
          {KNOWN_ACTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Start Date */}
        <div className="flex items-center gap-1 text-slate-400">
          <span>From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none transition-colors cursor-pointer"
          />
        </div>

        {/* End Date */}
        <div className="flex items-center gap-1 text-slate-400">
          <span>To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none transition-colors cursor-pointer"
          />
        </div>

        <div className="ml-auto text-slate-500 text-[11px] font-mono">
          Showing {logs.length} records
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Developer</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3 text-right">Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <TableSkeleton rows={5} columns={5} />
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  {hasActiveFilters
                    ? "No audit records match the selected filter criteria."
                    : "No audit logs recorded yet."}
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isExpanded = expandedId === log.id;
                const hasMetadata =
                  log.metadata && Object.keys(log.metadata).length > 0;
                const metadataString = hasMetadata
                  ? JSON.stringify(log.metadata, null, 2)
                  : "";

                return (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-slate-200 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span>{log.actor_email}</span>
                          <CopyButton text={log.actor_email} title="Copy email" />
                        </div>
                        {log.actor_ip && (
                          <div className="text-slate-500 text-[10px] font-mono mt-0.5">
                            IP: {log.actor_ip}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">{formatActionBadge(log.action_type)}</td>

                      <td className="px-4 py-3 text-slate-300 font-mono text-[11px]">
                        <div className="flex items-center gap-1">
                          <span>{log.target_entity || "-"}</span>
                          {log.target_entity && (
                            <CopyButton
                              text={log.target_entity}
                              title="Copy target entity"
                            />
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        {hasMetadata && (
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : log.id)}
                            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                          >
                            {isExpanded ? "Hide JSON" : "Inspect JSON"}
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expandable JSON Metadata Inspector */}
                    {isExpanded && (
                      <tr className="bg-slate-950/90">
                        <td colSpan={5} className="p-4 border-y border-slate-800/80">
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                            <span className="text-[11px] font-semibold text-slate-300">
                              Metadata Payload
                            </span>
                            <CopyButton
                              text={metadataString}
                              showText
                              textLabel="Copy JSON"
                              className="bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-xs text-cyan-300"
                            />
                          </div>
                          <pre className="text-[11px] font-mono text-cyan-300 bg-slate-900 p-3.5 rounded-lg border border-slate-800 overflow-x-auto leading-relaxed">
                            {metadataString}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
