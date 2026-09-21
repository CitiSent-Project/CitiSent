import React, { useState, useEffect } from "react";
import { opsApiClient } from "../services/opsApiClient";
import { Button } from "./common/Button";
import { Badge } from "./common/Badge";
import {
  IoPersonAddOutline,
  IoRefresh,
  IoSearchOutline,
  IoKeyOutline,
  IoSendOutline,
  IoLockOpenOutline,
  IoBanOutline,
  IoCheckmarkCircle,
} from "react-icons/io5";

export function SuperadminDirectory({ onOpenProvisionModal }) {
  const [superadmins, setSuperadmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  async function loadSuperadmins() {
    try {
      setLoading(true);
      const res = await opsApiClient.getSuperadmins();
      if (res.success) {
        setSuperadmins(res.data || []);
      }
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSuperadmins();
  }, []);

  async function handleResendInvite(admin) {
    try {
      setActionLoadingId(admin.user_id);
      setFeedback(null);
      const res = await opsApiClient.resendInvite(admin.user_id);
      if (res.success) {
        setFeedback({
          type: "success",
          message: `Invitation re-dispatched to ${admin.email}. Setup link: ${res.data.setupUrl}`,
        });
        await loadSuperadmins();
      }
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleUnlock(admin) {
    try {
      setActionLoadingId(admin.user_id);
      setFeedback(null);
      const res = await opsApiClient.unlockAccount(admin.user_id);
      if (res.success) {
        setFeedback({ type: "success", message: res.message });
        await loadSuperadmins();
      }
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleToggleStatus(admin) {
    const nextStatus = admin.account_status === "active" ? "suspended" : "active";
    try {
      setActionLoadingId(admin.user_id);
      setFeedback(null);
      const res = await opsApiClient.toggleStatus(admin.user_id, nextStatus);
      if (res.success) {
        setFeedback({ type: "success", message: res.message });
        await loadSuperadmins();
      }
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setActionLoadingId(null);
    }
  }

  const filtered = superadmins.filter((admin) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const name = `${admin.fname || ""} ${admin.lname || ""}`.toLowerCase();
    return (
      name.includes(q) ||
      (admin.email || "").toLowerCase().includes(q) ||
      (admin.city || "").toLowerCase().includes(q) ||
      (admin.display_id || "").includes(q)
    );
  });

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <IoKeyOutline className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100">
              City Superadmin Directory
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage provisioned municipal administrators across client cities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadSuperadmins}
            disabled={loading}
          >
            <IoRefresh className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenProvisionModal}
          >
            <IoPersonAddOutline className="w-4 h-4 mr-1.5" />
            Provision Superadmin
          </Button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
              : "bg-rose-950/60 border-rose-800 text-rose-300"
          }`}
        >
          <span className="break-all">{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-200 ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <IoSearchOutline className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, city jurisdiction, or Display ID..."
          className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
            <tr>
              <th className="px-4 py-3">Superadmin</th>
              <th className="px-4 py-3">Jurisdiction</th>
              <th className="px-4 py-3">Activation</th>
              <th className="px-4 py-3">Account Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Loading Superadmin accounts...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No Superadmin accounts found. Click "Provision Superadmin" to onboard your first client administrator.
                </td>
              </tr>
            ) : (
              filtered.map((admin) => {
                const isOperating = actionLoadingId === admin.user_id;
                const fullName = `${admin.fname || ""} ${admin.lname || ""}`.trim() || admin.email;
                return (
                  <tr key={admin.user_id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-200 flex items-center gap-2">
                        {fullName}
                        {admin.display_id && (
                          <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.2 rounded">
                            #{admin.display_id}
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">{admin.email}</div>
                      {admin.phone_number && (
                        <div className="text-slate-500 text-[10px]">{admin.phone_number}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant="purple" className="text-[10px]">
                        {admin.city || "City-wide"}
                      </Badge>
                      {admin.province && (
                        <div className="text-slate-500 text-[10px] mt-1">{admin.province}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {admin.activation_status === "active" ? (
                        <Badge variant="active">
                          <IoCheckmarkCircle className="w-3 h-3 mr-1" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="pending">Pending Invite</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {admin.account_status === "suspended" ? (
                        <Badge variant="suspended">Suspended</Badge>
                      ) : (
                        <Badge variant="active">Normal</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {admin.activation_status === "pending" && (
                          <button
                            type="button"
                            onClick={() => handleResendInvite(admin)}
                            disabled={isOperating}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Resend Activation Invitation Email"
                          >
                            <IoSendOutline className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleUnlock(admin)}
                          disabled={isOperating}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Clear OTP Lockout & Rate Limits"
                        >
                          <IoLockOpenOutline className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(admin)}
                          disabled={isOperating}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            admin.account_status === "suspended"
                              ? "text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
                              : "text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                          }`}
                          title={
                            admin.account_status === "suspended"
                              ? "Reactivate Account"
                              : "Suspend Account Access"
                          }
                        >
                          <IoBanOutline className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
