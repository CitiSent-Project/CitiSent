import crypto from "node:crypto";

const OTP_LENGTH = 6;
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds cooldown between sends
const MAX_VERIFY_ATTEMPTS = 5;
const SEND_RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const SEND_RATE_MAX = 3; // max 3 OTP requests per email per 10 min

/**
 * In-memory OTP storage for guest Gmail verifications.
 * @type {Map<string, { hash: string, expiresAt: number, attempts: number, lastSentAt: number }>}
 */
const guestOtpStore = new Map();

/**
 * Rate limit tracking per email address.
 * @type {Map<string, { count: number, windowStart: number }>}
 */
const guestSendRateStore = new Map();

/**
 * Normalizes and validates that the email address is a valid Gmail address.
 * Rejects non-Gmail addresses (e.g. yahoo.com, outlook.com, hotmail.com, company.com).
 * Returns normalized lowercase trimmed email string.
 */
export function normalizeGmailAddress(email) {
  if (!email || typeof email !== "string") {
    throw new Error("Please enter a valid Gmail address.");
  }

  const normalized = email.trim().toLowerCase();

  // Basic email pattern check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("Please enter a valid Gmail address.");
  }

  // Gmail domain check
  const atIndex = normalized.lastIndexOf("@");
  const domain = normalized.slice(atIndex + 1);

  if (domain !== "gmail.com") {
    throw new Error("Guest verification currently requires a Gmail address.");
  }

  const localPart = normalized.slice(0, atIndex);
  if (!localPart || localPart.length < 1) {
    throw new Error("Please enter a valid Gmail address.");
  }

  return normalized;
}

export function isGmailAddress(email) {
  try {
    normalizeGmailAddress(email);
    return true;
  } catch {
    return false;
  }
}

export const isValidGmailAddress = isGmailAddress;

function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp).trim()).digest("hex");
}

function generateSecureOtp() {
  const bytes = crypto.randomBytes(4);
  const num = bytes.readUInt32BE(0) % 1_000_000;
  return String(num).padStart(OTP_LENGTH, "0");
}

function pruneExpiredOtps() {
  const now = Date.now();
  for (const [key, entry] of guestOtpStore.entries()) {
    if (entry.expiresAt < now) {
      guestOtpStore.delete(key);
    }
  }

  for (const [key, entry] of guestSendRateStore.entries()) {
    if (now - entry.windowStart > SEND_RATE_WINDOW_MS) {
      guestSendRateStore.delete(key);
    }
  }
}

export const guestEmailOtpService = {
  /**
   * Check send rate limits and cooldown for the normalized email.
   * Throws an error with a user-friendly message if rate limited.
   */
  checkSendRateLimit(normalizedEmail) {
    pruneExpiredOtps();
    const now = Date.now();

    // 1. Check active resend cooldown (60 seconds)
    const existingEntry = guestOtpStore.get(normalizedEmail);
    if (existingEntry && existingEntry.lastSentAt) {
      const elapsed = now - existingEntry.lastSentAt;
      if (elapsed < RESEND_COOLDOWN_MS) {
        const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        throw new Error(
          `Please wait ${waitSeconds} second(s) before requesting another code.`,
        );
      }
    }

    // 2. Check 10-minute window rate limit (max 3)
    const rateEntry = guestSendRateStore.get(normalizedEmail);
    if (rateEntry && now - rateEntry.windowStart <= SEND_RATE_WINDOW_MS) {
      if (rateEntry.count >= SEND_RATE_MAX) {
        const waitMs = SEND_RATE_WINDOW_MS - (now - rateEntry.windowStart);
        const waitMinutes = Math.ceil(waitMs / 60_000);
        throw new Error(
          `Too many verification code requests. Please try again in ${waitMinutes} minute(s).`,
        );
      }
      rateEntry.count += 1;
    } else {
      guestSendRateStore.set(normalizedEmail, { count: 1, windowStart: now });
    }
  },

  /**
   * Generates a new 6-digit OTP, stores its SHA-256 hash, and invalidates any previous code.
   * Returns plaintext OTP to be dispatched via Email.
   */
  createOtp(normalizedEmail) {
    const plainOtp = generateSecureOtp();
    const hashed = hashOtp(plainOtp);
    const now = Date.now();

    // Overwrites and invalidates any previous OTP for this email
    guestOtpStore.set(normalizedEmail, {
      hash: hashed,
      expiresAt: now + OTP_TTL_MS,
      attempts: 0,
      lastSentAt: now,
    });

    return plainOtp;
  },

  /**
   * Verifies the user-submitted OTP against the stored hash.
   * Enforces attempt limits (max 5) and expiration.
   * On success, deletes the OTP (single-use) and returns true.
   */
  verifyOtp(normalizedEmail, submittedOtp) {
    pruneExpiredOtps();
    const entry = guestOtpStore.get(normalizedEmail);

    if (!entry) {
      throw new Error("This verification code has expired. Please request a new code.");
    }

    if (Date.now() > entry.expiresAt) {
      guestOtpStore.delete(normalizedEmail);
      throw new Error("This verification code has expired. Please request a new code.");
    }

    if (entry.attempts >= MAX_VERIFY_ATTEMPTS) {
      guestOtpStore.delete(normalizedEmail);
      throw new Error("Too many attempts. Please request a new verification code.");
    }

    const inputHash = hashOtp(submittedOtp);
    if (inputHash !== entry.hash) {
      entry.attempts += 1;
      const remaining = MAX_VERIFY_ATTEMPTS - entry.attempts;

      if (remaining <= 0) {
        guestOtpStore.delete(normalizedEmail);
        throw new Error("Too many attempts. Please request a new verification code.");
      }

      throw new Error(`Incorrect verification code. Please try again. (${remaining} attempt(s) remaining)`);
    }

    // Success: single-use, immediately invalidate
    guestOtpStore.delete(normalizedEmail);
    return true;
  },

  /**
   * Clear in-memory stores (primarily used for unit testing).
   */
  clearAll() {
    guestOtpStore.clear();
    guestSendRateStore.clear();
  },
};
