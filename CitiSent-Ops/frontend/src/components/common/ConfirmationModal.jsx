import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { IoWarningOutline, IoAlertCircleOutline, IoShieldOutline } from "react-icons/io5";

/**
 * ConfirmationModal Component
 *
 * Safety gate for high-impact and destructive administrative operations:
 * - Suspending or Reactivating Superadmin accounts
 * - Clearing security lockout rate limits
 * - Overwriting municipal department database presets
 *
 * @param {boolean} isOpen - Whether modal is visible
 * @param {() => void} onClose - Handler to cancel and close modal
 * @param {() => void} onConfirm - Handler to execute confirmed action
 * @param {string} title - Modal heading
 * @param {React.ReactNode} message - Detailed warning/explanation of the operation
 * @param {string} [confirmText="Confirm"] - Text for confirm button
 * @param {string} [cancelText="Cancel"] - Text for cancel button
 * @param {"danger" | "warning" | "primary"} [variant="danger"] - Visual styling mode
 * @param {boolean} [loading=false] - Whether operation is currently executing
 */
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
}) {
  const iconConfig = {
    danger: {
      icon: <IoAlertCircleOutline className="w-6 h-6 text-rose-400" />,
      bg: "bg-rose-500/10 border-rose-500/20",
    },
    warning: {
      icon: <IoWarningOutline className="w-6 h-6 text-amber-400" />,
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    primary: {
      icon: <IoShieldOutline className="w-6 h-6 text-cyan-400" />,
      bg: "bg-cyan-500/10 border-cyan-500/20",
    },
  };

  const currentIcon = iconConfig[variant] || iconConfig.danger;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className={`p-2 rounded-lg border shrink-0 ${currentIcon.bg}`}>
            {currentIcon.icon}
          </div>
          <div className="text-xs text-slate-300 leading-relaxed pt-0.5">
            {message}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800/80">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={variant === "warning" ? "primary" : variant}
            size="sm"
            onClick={onConfirm}
            loading={loading}
            disabled={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
