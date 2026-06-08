import crypto from "crypto";

/**
 * In-memory OTP store.
 *
 * Shape of each entry:
 * {
 *   hash:       string   SHA-256 hex of the plaintext OTP
 *   expiresAt:  number   epoch ms
 *   attempts:   number   failed verification attempts so far
 *   used:       boolean  true once successfully verified
 * }
 *
 * Shape of each send-rate entry:
 * {
 *   count:      number   requests in current window
 *   windowStart: number  epoch ms of window start
 * }
 */

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_VERIFY_ATTEMPTS = 5;
const SEND_RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const SEND_RATE_MAX = 3; // max OTP sends per email per window

const OTP_LENGTH = 6;

/** @type {Map<string, {hash: string, expiresAt: number, attempts: number, used: boolean}>} */
const otpStore = new Map();

/** @type {Map<string, {count: number, windowStart: number}>} */
const sendRateStore = new Map();

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

function generateOtp() {
  // Cryptographically random 6-digit number (zero-padded)
  const bytes = crypto.randomBytes(4);
  const num = bytes.readUInt32BE(0) % 1_000_000;
  return String(num).padStart(OTP_LENGTH, "0");
}

function pruneExpired() {
  const now = Date.now();
  for (const [key, entry] of otpStore.entries()) {
    if (entry.expiresAt < now) {
      otpStore.delete(key);
    }
  }
}

export const otpStore_ = {
  /**
   * Check and enforce send rate limit for an email.
   * Throws if the limit is exceeded.
   * @param {string} email
   */
  checkSendRateLimit(email) {
    const key = normalizeEmail(email);
    const now = Date.now();
    const entry = sendRateStore.get(key);

    if (!entry || now - entry.windowStart > SEND_RATE_WINDOW_MS) {
      sendRateStore.set(key, { count: 1, windowStart: now });
      return;
    }

    if (entry.count >= SEND_RATE_MAX) {
      const waitMs = SEND_RATE_WINDOW_MS - (now - entry.windowStart);
      const waitMin = Math.ceil(waitMs / 60_000);
      throw new Error(
        `Too many OTP requests. Please wait ${waitMin} minute(s) before trying again.`,
      );
    }

    entry.count += 1;
  },

  /**
   * Create (or replace) an OTP for the given email.
   * Returns the plaintext OTP (to be emailed — never stored).
   * @param {string} email
   * @returns {string} plaintext OTP
   */
  createOtp(email) {
    pruneExpired();
    const key = normalizeEmail(email);
    const plaintext = generateOtp();
    otpStore.set(key, {
      hash: hashOtp(plaintext),
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
      used: false,
    });
    return plaintext;
  },

  /**
   * Verify a plaintext OTP for the given email.
   * Returns true on success, throws a descriptive Error on failure.
   * On success the OTP is immediately invalidated.
   * @param {string} email
   * @param {string} otp  plaintext 6-digit code from the user
   * @returns {true}
   */
  verifyOtp(email, otp) {
    const key = normalizeEmail(email);
    const entry = otpStore.get(key);

    if (!entry) {
      throw new Error("No OTP was requested for this email, or it has already expired.");
    }

    if (entry.used) {
      throw new Error("This OTP has already been used.");
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(key);
      throw new Error("Your OTP has expired. Please request a new one.");
    }

    if (entry.attempts >= MAX_VERIFY_ATTEMPTS) {
      otpStore.delete(key);
      throw new Error(
        "Too many failed attempts. Your OTP has been invalidated. Please request a new one.",
      );
    }

    const inputHash = hashOtp(String(otp).trim());
    if (inputHash !== entry.hash) {
      entry.attempts += 1;
      const remaining = MAX_VERIFY_ATTEMPTS - entry.attempts;
      if (remaining <= 0) {
        otpStore.delete(key);
        throw new Error(
          "Too many failed attempts. Your OTP has been invalidated. Please request a new one.",
        );
      }
      throw new Error(
        `Incorrect OTP. You have ${remaining} attempt(s) remaining.`,
      );
    }

    // Success — immediately invalidate
    otpStore.delete(key);
    return true;
  },

  /**
   * Manually delete an OTP (e.g., after password reset completes).
   * @param {string} email
   */
  deleteOtp(email) {
    otpStore.delete(normalizeEmail(email));
  },
};
