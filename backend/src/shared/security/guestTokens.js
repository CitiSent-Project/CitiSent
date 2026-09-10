import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

const GUEST_JWT_SECRET =
  env.INVITATION_JWT_SECRET ||
  "citisent-secure-guest-session-secret-key-32chars-min";

/**
 * Signs a guest session token (expires in 7 days).
 */
export function signGuestToken({ guestId, isVerified = false, email = null }) {
  return jwt.sign(
    {
      guestId,
      role: "guest",
      isGuest: true,
      isVerified: Boolean(isVerified),
      email: email || null,
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
