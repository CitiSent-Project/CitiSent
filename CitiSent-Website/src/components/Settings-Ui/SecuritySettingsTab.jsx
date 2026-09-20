import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { SettingsSectionCard } from "../Account-Ui";
import { SettingsSelect } from "./SettingsSelect";
import { authApiService } from "../../services/api/auth/authApiService";
import { useModalAccessibility } from "../../hooks/shared/useModalAccessibility";
import { ModalShell } from "../ui/ModalShell";
import { FiEye, FiEyeOff } from "react-icons/fi";

const timeoutOptions = [
  { label: "5 minutes", value: 5 },
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
  { label: "60 minutes", value: 60 },
];

export function SecuritySettingsTab({
  profile,
  accessToken,
  preferences,
  onUpdatePreference,
  onRequestLogout,
}) {
  const sessionTimeout = preferences?.sessionTimeout ?? 30;

  // State for Change Password flow
  const [step, setStep] = useState("idle"); // 'idle' | 'otp' | 'password'
  const [otpCode, setOtpCode] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  // Modal accessibility
  const dialogRef = useRef(null);
  useModalAccessibility({
    isOpen: showSuccessModal,
    onClose: onRequestLogout,
    containerRef: dialogRef,
  });

  function handleSessionTimeoutChange(event) {
    onUpdatePreference("sessionTimeout", Number(event.target.value));
  }

  function handleLogoutClick() {
    onRequestLogout();
  }

  async function handleRequestOtp() {
    setIsSubmitting(true);
    setFeedback({ type: "", message: "" });
    try {
      await authApiService.requestOtp({ email: profile.email });
      setStep("otp");
      setFeedback({ type: "success", message: "Verification code sent to your email." });
    } catch (error) {
      setFeedback({ type: "error", message: error?.response?.data?.message || "Failed to send OTP." });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback({ type: "", message: "" });
    try {
      await authApiService.verifyOtp({ email: profile.email, otp: otpCode });
      setStep("password");
      setFeedback({ type: "success", message: "OTP verified. Please enter your new password." });
    } catch (error) {
      setFeedback({ type: "error", message: error?.response?.data?.message || "Invalid OTP code." });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPassword.length < 8) {
      setFeedback({ type: "error", message: "New password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", message: "Passwords do not match." });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: "", message: "" });
    try {
      await authApiService.changePassword(accessToken, { currentPassword, newPassword });
      setShowSuccessModal(true);
    } catch (error) {
      setFeedback({ type: "error", message: error?.response?.data?.message || "Failed to change password." });
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetFlow() {
    setStep("idle");
    setOtpCode("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setFeedback({ type: "", message: "" });
    setShowPasswords(false);
  }

  return (
    <>
      <SettingsSectionCard
        title="Security"
        description="Manage session behavior and review security actions."
      >
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition-all duration-300 dark:border-slate-700 dark:bg-slate-900/50">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Change password</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Securely change your account password. We will send a verification code to your email first.
          </p>

          {feedback.message && (
            <div className={`mt-3 rounded-md p-3 text-sm ${feedback.type === "error" ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"}`}>
              {feedback.message}
            </div>
          )}

          {step === "idle" && (
            <button
              type="button"
              onClick={handleRequestOtp}
              disabled={isSubmitting}
              className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? "Sending code..." : "Change password"}
            </button>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="mt-4 flex flex-col gap-3">
              <div>
                <label htmlFor="otp" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Verification Code (6-digit)
                </label>
                <input
                  id="otp"
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="block w-full max-w-50 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900/60 dark:text-white"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting || otpCode.length !== 6}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? "Verifying..." : "Verify Code"}
                </button>
                <button
                  type="button"
                  onClick={resetFlow}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={handleChangePassword} className="mt-4 flex max-w-sm flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Current Password</label>
                <div className="relative">
                  <input
                    type={showPasswords ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 pl-3 pr-10 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900/60 dark:text-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    {showPasswords ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 pl-3 pr-10 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900/60 dark:text-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    {showPasswords ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 pl-3 pr-10 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900/60 dark:text-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    {showPasswords ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Password"}
                </button>
                <button
                  type="button"
                  onClick={resetFlow}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <SettingsSelect
          label="Session timeout"
          value={sessionTimeout}
          onChange={handleSessionTimeoutChange}
          options={timeoutOptions}
        />

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Two-Factor Authentication</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            2FA enrollment is currently unavailable and has not been enabled for this portal.
          </p>
          <button
            type="button"
            disabled
            className="mt-3 rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
          >
            Not enabled
          </button>
        </div>

        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-900/50 dark:bg-rose-950/30">
          <p className="text-sm font-medium text-red-900 dark:text-rose-200">Security action</p>
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
            For demo purposes, sign out and return to the login screen.
          </p>
          <button
            type="button"
            onClick={handleLogoutClick}
            className="mt-3 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-500 transition"
          >
            Sign out now
          </button>
        </div>
      </SettingsSectionCard>

      {/* Success Modal for Auto Logout */}
      <ModalShell
        isOpen={showSuccessModal}
        onClose={onRequestLogout}
        dialogRef={dialogRef}
        role="alertdialog"
        ariaLabelledBy="relogin-title"
        ariaDescribedBy="relogin-desc"
        maxWidth="max-w-md"
        className="p-6"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7 text-emerald-600 dark:text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 id="relogin-title" className="text-center text-lg font-semibold text-slate-900 dark:text-white">
          Password Changed Successfully
        </h2>
        <p id="relogin-desc" className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          For security purposes, you will now be logged out. Please sign in again with your new password.
        </p>
        <motion.button
          type="button"
          onClick={onRequestLogout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          className="mt-6 w-full rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer"
        >
          Acknowledge and Sign Out
        </motion.button>
      </ModalShell>
    </>
  );
}
