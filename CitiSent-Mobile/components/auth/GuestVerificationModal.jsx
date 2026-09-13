import React from "react";
import TurnstileModal from "./TurnstileModal";

/**
 * GuestVerificationModal
 *
 * Wraps TurnstileModal to maintain the existing API surface used by [issueId].jsx.
 * The Gmail OTP flow has been replaced with Cloudflare Turnstile CAPTCHA.
 *
 * Props:
 * - visible:     boolean   — Whether the modal is visible.
 * - onClose:     function  — Called when the user cancels.
 * - onVerified:  function  — Called with (token: string) when CAPTCHA succeeds.
 */
export default function GuestVerificationModal({ visible, onClose, onVerified }) {
  function handleTokenReceived(token) {
    if (onVerified) {
      onVerified(token);
    }
  }

  function handleError() {
    // Errors are displayed inside TurnstileModal itself.
  }

  return (
    <TurnstileModal
      visible={visible}
      onClose={onClose}
      onTokenReceived={handleTokenReceived}
      onError={handleError}
    />
  );
}
