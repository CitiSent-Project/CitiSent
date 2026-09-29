import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

const GUEST_JWT_SECRET =
  env.INVITATION_JWT_SECRET ||
  "citisent-secure-guest-session-secret-key-32chars-min";

/**
 * Signs a guest session token (expires in 7 days).
 * The isVerified field has been removed — guest verification is now done
 * per-submission via Cloudflare Turnstile CAPTCHA, not per-session via Gmail OTP.
 */
export function signGuestToken({ guestId }) {
  return jwt.sign(
    {
      guestId,
      role: "guest",
      isGuest: true,
      purpose: "guest_session",
    },
    GUEST_JWT_SECRET,
    { expiresIn: "7d" },
  );
}

/**
 * Attempts to decode and verify a token as a guest token.
 * Returns decoded payload if valid guest token, or null if not a guest token.
 * Throws only if it was clearly intended as a guest token but has expired or been tampered with.
 */
export function tryVerifyGuestToken(token) {
  try {
    const unverified = jwt.decode(token);
    if (!unverified || typeof unverified !== "object" || !unverified.isGuest) {
      return null;
    }

    return jwt.verify(token, GUEST_JWT_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      const err = new Error("Guest session has expired. Please refresh your session.");
      err.code = "GUEST_SESSION_EXPIRED";
      err.isGuestError = true;
      throw err;
    }
    if (error.name === "JsonWebTokenError") {
      const err = new Error("Invalid guest session token.");
      err.code = "INVALID_GUEST_TOKEN";
      err.isGuestError = true;
      throw err;
    }
    return null;
  }
}

/**
 * Signs a persistent device recovery token (expires in 365 days).
 * Stored securely on the mobile device to authenticate the device when
 * recovering/reusing its existing guest account without re-creating accounts.
 */
export function signGuestRecoveryToken({ guestId }) {
  return jwt.sign(
    {
      guestId,
      role: "guest",
      isGuest: true,
      purpose: "guest_recovery",
    },
    GUEST_JWT_SECRET,
    { expiresIn: "365d" },
  );
}

/**
 * Verifies a guest recovery token.
 * Returns decoded payload if valid and matches guest recovery purpose,
 * or null if invalid or expired.
 */
export function tryVerifyGuestRecoveryToken(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  try {
    const unverified = jwt.decode(token);
    if (
      !unverified ||
      typeof unverified !== "object" ||
      !unverified.isGuest ||
      unverified.purpose !== "guest_recovery"
    ) {
      return null;
    }

    return jwt.verify(token, GUEST_JWT_SECRET);
  } catch {
    return null;
  }
}
