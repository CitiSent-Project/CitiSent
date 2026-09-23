import React, { useState, useEffect } from "react";
import { opsApiClient } from "../services/opsApiClient";
import { Button } from "./common/Button";
import { Badge } from "./common/Badge";
import { IoListOutline, IoRefresh } from "react-icons/io5";

export function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  async function loadLogs() {
    try {
      setLoading(true);
      const res = await opsApiClient.getAuditLogs();
      if (res.success) {
        setLogs(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  function formatActionBadge(action) {
    if (action.includes("PROVISION") || action.includes("SEEDED")) {
      return <Badge variant="active">{action}</Badge>;
    }
    if (action.includes("UNLOCKED")) {
      return <Badge variant="info">{action}</Badge>;
    }
    if (action.includes("SUSPENDED")) {
      return <Badge variant="suspended">{action}</Badge>;
    }
    return <Badge variant="default">{action}</Badge>;
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
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

        <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
          <IoRefresh className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Developer</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Loading audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No audit logs recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isExpanded = expandedId === log.id;
                return (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-200 font-medium">
                        {log.actor_email}
                        <div className="text-slate-500 text-[10px] font-mono">
                          {log.actor_ip}
                        </div>
                      </td>
                      <td className="px-4 py-3">{formatActionBadge(log.action_type)}</td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-[11px]">
                        {log.target_entity || "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : log.id)}
                            className="text-xs text-cyan-400 hover:underline cursor-pointer"
                          >
                            {isExpanded ? "Hide" : "View JSON"}
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-950/80">
                        <td colSpan={5} className="p-4">
                          <pre className="text-[11px] font-mono text-cyan-300 bg-slate-900 p-3 rounded-lg border border-slate-800 overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
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
