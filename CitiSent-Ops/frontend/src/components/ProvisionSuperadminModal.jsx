import React, { useState } from "react";
import { opsApiClient } from "../services/opsApiClient";
import { Modal } from "./common/Modal";
import { Button } from "./common/Button";
import { IoCheckmark, IoCopyOutline, IoMailOutline } from "react-icons/io5";

export function ProvisionSuperadminModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({
    fname: "",
    mname: "",
    lname: "",
    email: "",
    phoneNumber: "",
    city: "",
    province: "",
    barangay: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successResult, setSuccessResult] = useState(null);
  const [copied, setCopied] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await opsApiClient.provisionSuperadmin(form);
      if (res.success && res.data) {
        setSuccessResult(res.data);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setError(err.message || "Failed to provision Superadmin.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCopySetupUrl() {
    if (!successResult?.setupUrl) return;
    navigator.clipboard.writeText(successResult.setupUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleReset() {
    setForm({
      fname: "",
      mname: "",
      lname: "",
      email: "",
      phoneNumber: "",
      city: "",
      province: "",
      barangay: "",
    });
    setSuccessResult(null);
    setError(null);
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title={successResult ? "Superadmin Provisioned" : "Provision Client Superadmin"}
      subtitle={
        successResult
          ? "Account created & invitation dispatched."
          : "Onboard the municipal administrator for your client city."
      }
      maxWidth="max-w-2xl"
    >
      {successResult ? (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-200 text-sm flex items-start gap-3">
            <IoMailOutline className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-300">
                Official Invitation Dispatched!
              </p>
              <p className="text-xs text-emerald-400/90 mt-1">
                An invitation email has been sent to{" "}
                <strong>{successResult.email}</strong> with instructions to activate
                their account on the municipal portal.
              </p>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">
                Direct Setup URL Fallback
              </span>
              <button
                type="button"
                onClick={handleCopySetupUrl}
                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
              >
                {copied ? (
                  <>
                    <IoCheckmark className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <IoCopyOutline className="w-3.5 h-3.5" />
                    <span>Copy Setup URL</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              If client governmental firewalls delay email delivery, you can copy and securely deliver this URL directly:
            </p>
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg font-mono text-[11px] text-cyan-300 break-all select-all">
              {successResult.setupUrl}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" onClick={handleReset}>
              Done & Close
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="fname"
                required
                value={form.fname}
                onChange={handleChange}
                placeholder="Maria"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Middle Name
              </label>
              <input
                type="text"
                name="mname"
                value={form.mname}
                onChange={handleChange}
                placeholder="Santos"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="lname"
                required
                value={form.lname}
                onChange={handleChange}
                placeholder="Dela Cruz"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Official Government Email *
              </label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="superadmin@city.gov.ph"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Contact Phone Number *
              </label>
              <input
                type="text"
                name="phoneNumber"
                required
                value={form.phoneNumber}
                onChange={handleChange}
                placeholder="+63 917 123 4567"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                City Jurisdiction *
              </label>
              <input
                type="text"
                name="city"
                required
                value={form.city}
                onChange={handleChange}
                placeholder="Quezon City"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Province
              </label>
              <input
                type="text"
                name="province"
                value={form.province}
                onChange={handleChange}
                placeholder="Metro Manila"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Barangay
              </label>
              <input
                type="text"
                name="barangay"
                value={form.barangay}
                onChange={handleChange}
                placeholder="Central"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="outline" onClick={handleReset} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Provision & Send Invitation
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
