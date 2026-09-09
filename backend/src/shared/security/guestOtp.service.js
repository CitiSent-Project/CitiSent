import crypto from "node:crypto";

const OTP_LENGTH = 6;
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds cooldown between sends
const MAX_VERIFY_ATTEMPTS = 5;
const SEND_RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const SEND_RATE_MAX = 3; // max 3 OTP requests per phone number per 10 min

/**
 * In-memory OTP storage for guest phone verifications.
 * @type {Map<string, { hash: string, expiresAt: number, attempts: number, lastSentAt: number }>}
 */
const guestOtpStore = new Map();

/**
 * Rate limit tracking per phone number.
 * @type {Map<string, { count: number, windowStart: number }>}
 */
const guestSendRateStore = new Map();

/**
 * Normalizes and validates Philippine mobile phone numbers.
 * Supports inputs:
 *  - 09XXXXXXXXX (11 digits)
 *  - 9XXXXXXXXX (10 digits)
 *  - +639XXXXXXXXX (13 chars)
 *  - 639XXXXXXXXX (12 digits)
 * Returns normalized E.164-style format: "+639XXXXXXXXX"
 * Throws an Error if the phone number is invalid.
 */
export function normalizePhilippinePhoneNumber(phoneNumber) {
  if (!phoneNumber || typeof phoneNumber !== "string") {
    throw new Error("Phone number is required");
  }

  // Strip all non-digit characters except leading +
  const cleaned = phoneNumber.trim().replace(/[^\d+]/g, "");

  let digits = cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;

  // If starts with 09 (11 digits: 09XXXXXXXXX)
  if (digits.startsWith("09") && digits.length === 11) {
    digits = "63" + digits.slice(1);
  } else if (digits.startsWith("9") && digits.length === 10) {
    // 9XXXXXXXXX (10 digits)
    digits = "63" + digits;
  } else if (digits.startsWith("639") && digits.length === 12) {
    // 639XXXXXXXXX (12 digits) - already has 63
  } else {
    throw new Error(
      "Invalid Philippine mobile number. Please use the format 09XXXXXXXXX.",
    );
  }

  // Must now be exactly 12 digits starting with 639
  if (!/^639\d{9}$/.test(digits)) {
    throw new Error(
      "Invalid Philippine mobile number. Please use the format 09XXXXXXXXX.",
    );
  }

  return `+${digits}`;
}

export function isValidPhilippinePhoneNumber(phoneNumber) {
  try {
    normalizePhilippinePhoneNumber(phoneNumber);
    return true;
  } catch {
    return false;
  }
}

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

export const guestOtpService = {
  /**
   * Check send rate limits and cooldown for the normalized phone number.
   * Throws an error with user-friendly message if rate limited.
   */
  checkSendRateLimit(normalizedPhone) {
    pruneExpiredOtps();
    const now = Date.now();

    // 1. Check active resend cooldown
    const existingEntry = guestOtpStore.get(normalizedPhone);
    if (existingEntry && existingEntry.lastSentAt) {
      const elapsed = now - existingEntry.lastSentAt;
      if (elapsed < RESEND_COOLDOWN_MS) {
        const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        throw new Error(
          `Please wait ${waitSeconds} second(s) before requesting another code.`,
        );
      }
    }

    // 2. Check 10-minute window rate limit
    const rateEntry = guestSendRateStore.get(normalizedPhone);
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
      guestSendRateStore.set(normalizedPhone, { count: 1, windowStart: now });
    }
  },

  /**
   * Generates a new 6-digit OTP, stores its SHA-256 hash, and invalidates any previous code.
   * Returns plaintext OTP to be dispatched via SMS.
   */
  createOtp(normalizedPhone) {
    const plainOtp = generateSecureOtp();
    const hashed = hashOtp(plainOtp);
    const now = Date.now();

    // Overwrites and invalidates any previous OTP for this phone number
    guestOtpStore.set(normalizedPhone, {
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
  verifyOtp(normalizedPhone, submittedOtp) {
    pruneExpiredOtps();
    const entry = guestOtpStore.get(normalizedPhone);

    if (!entry) {
      throw new Error("No verification code found or it has already expired. Please request a new one.");
    }

    if (Date.now() > entry.expiresAt) {
      guestOtpStore.delete(normalizedPhone);
      throw new Error("Verification code has expired. Please request a new one.");
    }

    if (entry.attempts >= MAX_VERIFY_ATTEMPTS) {
      guestOtpStore.delete(normalizedPhone);
      throw new Error("Too many failed attempts. Your verification code has been invalidated. Please request a new one.");
    }

    const inputHash = hashOtp(submittedOtp);
    if (inputHash !== entry.hash) {
      entry.attempts += 1;
      const remaining = MAX_VERIFY_ATTEMPTS - entry.attempts;

      if (remaining <= 0) {
        guestOtpStore.delete(normalizedPhone);
        throw new Error("Too many failed attempts. Your verification code has been invalidated. Please request a new one.");
      }

      throw new Error(`Incorrect verification code. ${remaining} attempt(s) remaining.`);
    }

    // Success: single-use, immediately invalidate
    guestOtpStore.delete(normalizedPhone);
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
