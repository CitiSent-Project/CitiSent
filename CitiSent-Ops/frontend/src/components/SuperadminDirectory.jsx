import React, { useState, useEffect } from "react";
import { opsApiClient } from "../services/opsApiClient";
import { Button } from "./common/Button";
import { Badge } from "./common/Badge";
import { CopyButton } from "./common/CopyButton";
import { TableSkeleton } from "./common/TableSkeleton";
import { ConfirmationModal } from "./common/ConfirmationModal";
import { useToast } from "../context/ToastContext";
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

/**
 * SuperadminDirectory Component
 *
 * Provides lifecycle management for City Superadministrators across municipal jurisdictions:
 * - Real-time filtering and search
 * - Instant clipboard copying for Display IDs, Emails, and Invite Links
 * - High-safety confirmation modals for account status changes and lockout resets
 * - Animated skeleton loaders during asynchronous data fetching
 */
export function SuperadminDirectory({ onOpenProvisionModal }) {
  const { showToast } = useToast();

  const [superadmins, setSuperadmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [lastInviteUrl, setLastInviteUrl] = useState(null);

  // Safety Confirmation Modal state
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  async function loadSuperadmins() {
    try {
      setLoading(true);
      const res = await opsApiClient.getSuperadmins();
      if (res.success) {
        setSuperadmins(res.data || []);
      }
    } catch (err) {
      showToast({
        type: "error",
        title: "Query Failed",
        message: err.message || "Failed to load superadmins.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSuperadmins();
  }, []);

  /**
   * Resend the onboarding invitation with new JWT token
   */
  async function executeResendInvite(admin) {
    try {
      setActionLoadingId(admin.user_id);
      const res = await opsApiClient.resendInvite(admin.user_id);
      if (res.success) {
        const setupUrl = res.data?.setupUrl;
        const emailStatus = res.data?.emailStatus;
        setLastInviteUrl({ email: admin.email, url: setupUrl });

        if (emailStatus?.delivered) {
          showToast({
            type: "success",
            title: "Invitation Delivered",
            message: `Activation email delivered to ${admin.email} via ${emailStatus.provider || "email service"}.`,
          });
        } else {
          showToast({
            type: "warning",
            title: "Invite Link Generated",
            message: res.message || `Invite link generated for ${admin.email}.`,
          });
        }
        await loadSuperadmins();
      }
    } catch (err) {
      showToast({
        type: "error",
        title: "Dispatch Failed",
        message: err.message || "Failed to resend invitation email.",
      });
    } finally {
      setActionLoadingId(null);
    }
  }

  /**
   * Clear rate limit lockouts and failed OTP counters
   */
  async function executeUnlock(admin) {
    try {
      setConfirmLoading(true);
      const res = await opsApiClient.unlockAccount(admin.user_id);
      if (res.success) {
        showToast({
          type: "success",
          title: "Lockout Cleared",
          message: res.message || `Account unlocked for ${admin.email}.`,
        });
        await loadSuperadmins();
      }
    } catch (err) {
      showToast({
        type: "error",
        title: "Unlock Failed",
        message: err.message || "Failed to unlock superadmin account.",
      });
    } finally {
      setConfirmLoading(false);
      setConfirmAction(null);
    }
  }

  /**
   * Toggle account between active and suspended
   */
  async function executeToggleStatus(admin) {
    const isCurrentlyActive = admin.account_status === "active";
    const nextStatus = isCurrentlyActive ? "suspended" : "active";

    try {
      setConfirmLoading(true);
      const res = await opsApiClient.toggleStatus(admin.user_id, nextStatus);
      if (res.success) {
        showToast({
          type: "success",
          title: isCurrentlyActive ? "Account Suspended" : "Account Reactivated",
          message: res.message || `Status updated to ${nextStatus}.`,
        });
        await loadSuperadmins();
      }
    } catch (err) {
      showToast({
        type: "error",
        title: "Action Failed",
        message: err.message || "Failed to update account status.",
      });
    } finally {
      setConfirmLoading(false);
      setConfirmAction(null);
    }
  }

  // Filter accounts by search query across multiple fields
  const filtered = superadmins.filter((admin) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const name = `${admin.fname || ""} ${admin.lname || ""}`.toLowerCase();
    return (
      name.includes(q) ||
      (admin.email || "").toLowerCase().includes(q) ||
      (admin.city || "").toLowerCase().includes(q) ||
      (admin.province || "").toLowerCase().includes(q) ||
      (admin.display_id || "").includes(q)
    );
  });

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
      {/* Header & Primary Controls */}
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

      {/* Direct Invitation Link Alert (if recently resent) */}
      {lastInviteUrl && (
        <div className="p-3.5 rounded-xl border border-cyan-800/80 bg-cyan-950/40 text-cyan-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="font-semibold text-cyan-300">Invite Link Ready:</span>{" "}
            <span className="text-slate-300">For {lastInviteUrl.email}</span>
            <div className="font-mono text-[11px] text-slate-400 truncate mt-0.5">
              {lastInviteUrl.url}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CopyButton
              text={lastInviteUrl.url}
              showText
              textLabel="Copy Setup URL"
              className="bg-cyan-900/60 hover:bg-cyan-800/80 text-cyan-200 border border-cyan-700/60 px-2.5 py-1 text-xs"
            />
            <button
              type="button"
              onClick={() => setLastInviteUrl(null)}
              className="text-slate-400 hover:text-slate-200 px-1 text-base cursor-pointer"
              title="Dismiss"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <IoSearchOutline className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, city jurisdiction, or Display ID..."
          className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none transition-colors"
        />
      </div>

      {/* Directory Table */}
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
              <TableSkeleton rows={4} columns={5} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No Superadmin accounts found. Click "Provision Superadmin" to onboard your first client administrator.
                </td>
              </tr>
            ) : (
              filtered.map((admin) => {
                const isOperating = actionLoadingId === admin.user_id;
                const fullName =
                  `${admin.fname || ""} ${admin.lname || ""}`.trim() || admin.email;
                const isSuspended = admin.account_status === "suspended";

                return (
                  <tr key={admin.user_id} className="hover:bg-slate-900/40 transition-colors">
                    {/* Superadmin identity */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5 flex-wrap">
                        <span>{fullName}</span>
                        {admin.display_id && (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.2 rounded">
                            #{admin.display_id}
                            <CopyButton
                              text={admin.display_id}
                              title="Copy Display ID"
                              className="p-0.5"
                            />
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-1.5">
                        <span>{admin.email}</span>
                        <CopyButton
                          text={admin.email}
                          title="Copy Email"
                          className="p-0.5"
                        />
                      </div>
                      {admin.phone_number && (
                        <div className="text-slate-500 text-[10px] mt-0.5">{admin.phone_number}</div>
                      )}
                    </td>

                    {/* Jurisdiction */}
                    <td className="px-4 py-3.5">
                      <Badge variant="purple" className="text-[10px]">
                        {admin.city || "City-wide"}
                      </Badge>
                      {admin.province && (
                        <div className="text-slate-500 text-[10px] mt-1">{admin.province}</div>
                      )}
                    </td>

                    {/* Activation status */}
                    <td className="px-4 py-3.5">
                      {admin.activation_status === "active" ? (
                        <Badge variant="active">
                          <IoCheckmarkCircle className="w-3 h-3 mr-1" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="pending">Pending Invite</Badge>
                      )}
                    </td>

                    {/* Account status */}
                    <td className="px-4 py-3.5">
                      {isSuspended ? (
                        <Badge variant="suspended">Suspended</Badge>
                      ) : (
                        <Badge variant="active">Normal</Badge>
                      )}
                    </td>

                    {/* Quick Administrative Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Resend invite button */}
                        {admin.activation_status === "pending" && (
                          <button
                            type="button"
                            onClick={() => executeResendInvite(admin)}
                            disabled={isOperating}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Resend Activation Invitation Email"
                          >
                            <IoSendOutline className="w-4 h-4" />
                          </button>
                        )}

                        {/* Unlock lockout button */}
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmAction({
                              type: "unlock",
                              admin,
                              title: "Reset Security Lockout",
                              message: (
                                <span>
                                  Reset failed login attempts and rate limit lockouts for{" "}
                                  <strong className="text-slate-200">{admin.email}</strong>? This will immediately allow them to retry 2FA verification.
                                </span>
                              ),
                              confirmText: "Clear Lockout",
                              variant: "warning",
                            })
                          }
                          disabled={isOperating}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Clear OTP Lockout & Rate Limits"
                        >
                          <IoLockOpenOutline className="w-4 h-4" />
                        </button>

                        {/* Suspend / Reactivate button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isSuspended) {
                              setConfirmAction({
                                type: "activate",
                                admin,
                                title: "Reactivate Superadmin Account",
                                message: (
                                  <span>
                                    Reactivate platform access for{" "}
                                    <strong className="text-slate-200">{fullName}</strong> ({admin.email})? They will immediately regain municipal administrative privileges.
                                  </span>
                                ),
                                confirmText: "Reactivate Account",
                                variant: "primary",
                              });
                            } else {
                              setConfirmAction({
                                type: "suspend",
                                admin,
                                title: "Suspend Superadmin Access",
                                message: (
                                  <span>
                                    Are you sure you want to suspend access for{" "}
                                    <strong className="text-rose-300">{fullName}</strong> ({admin.email})? They will be blocked from logging into the CitiSent portal until reactivated.
                                  </span>
                                ),
                                confirmText: "Suspend Account",
                                variant: "danger",
                              });
                            }
                          }}
                          disabled={isOperating}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isSuspended
                              ? "text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
                              : "text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                            }`}
                          title={isSuspended ? "Reactivate Account" : "Suspend Account Access"}
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

      {/* Safety Confirmation Modal */}
      {confirmAction && (
        <ConfirmationModal
          isOpen={Boolean(confirmAction)}
          onClose={() => {
            if (!confirmLoading) setConfirmAction(null);
          }}
          onConfirm={() => {
            if (confirmAction.type === "unlock") {
              executeUnlock(confirmAction.admin);
            } else if (
              confirmAction.type === "suspend" ||
              confirmAction.type === "activate"
            ) {
              executeToggleStatus(confirmAction.admin);
            }
          }}
          title={confirmAction.title}
          message={confirmAction.message}
          confirmText={confirmAction.confirmText}
          variant={confirmAction.variant}
          loading={confirmLoading}
        />
      )}
    </div>
  );
}
