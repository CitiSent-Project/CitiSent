import crypto from "crypto";
import { env } from "../../config/env.js";

const DEFAULT_OTP_TTL_SECONDS = env.OTP_EXPIRY_SECONDS || 300; // 5 minutes
const DEFAULT_COOLDOWN_SECONDS = env.OTP_RESEND_COOLDOWN_SECONDS || 60; // 60 seconds
const DEFAULT_MAX_ATTEMPTS = env.OTP_MAX_ATTEMPTS || 5;

const SEND_RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const SEND_RATE_MAX_PER_PHONE = 5; // max 5 OTP requests per phone in 10 minutes

/**
 * Stores pending registration sessions keyed by registrationToken.
 * @type {Map<string, Object>}
 */
const pendingStore = new Map();

/**
 * Secondary index: maps normalized phone (e.g. "+639171234567") -> registrationToken
 * @type {Map<string, string>}
 */
const phoneIndex = new Map();

/**
 * Secondary index: maps normalized email -> registrationToken
 * @type {Map<string, string>}
 */
const emailIndex = new Map();

/**
 * Send rate limit tracker per phone: maps phone -> { count, windowStart }
 * @type {Map<string, { count: number, windowStart: number }>}
 */
const phoneRateStore = new Map();

/**
 * In-flight lock for completion to prevent concurrent race conditions
 * @type {Set<string>}
 */
const inFlightCompletions = new Set();

function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp || "").trim()).digest("hex");
}

function generateCryptographicOtp() {
  // Cryptographically secure 6-digit numeric string [100000..999999]
  const num = crypto.randomInt(100000, 1000000);
  return String(num);
}

function generateRegistrationToken() {
  return crypto.randomBytes(32).toString("hex");
}

function pruneExpired() {
  const now = Date.now();
  // Keep expired entries for a 2-minute grace period so users get an explicit
  // "expired code" error rather than a generic "session not found" error.
  const PRUNE_BUFFER_MS = 2 * 60 * 1000;
  for (const [token, entry] of pendingStore.entries()) {
    const expiry = (entry.completed ? entry.expiresAt + 5 * 60 * 1000 : entry.expiresAt) + PRUNE_BUFFER_MS;
    if (now > expiry) {
      pendingStore.delete(token);
      if (entry.phoneNumber && phoneIndex.get(entry.phoneNumber) === token) {
        phoneIndex.delete(entry.phoneNumber);
      }
      if (entry.email && emailIndex.get(entry.email) === token) {
        emailIndex.delete(entry.email);
      }
    }
  }
}

export const pendingRegistrationStore = {
  /**
   * Checks and increments the send rate limit for a phone number.
   * Throws if limit exceeded.
   * @param {string} phoneNumber
   */
  checkPhoneSendRateLimit(phoneNumber) {
    const key = String(phoneNumber || "").trim();
    const now = Date.now();
    const entry = phoneRateStore.get(key);

    if (!entry || now - entry.windowStart > SEND_RATE_WINDOW_MS) {
      phoneRateStore.set(key, { count: 1, windowStart: now });
      return;
    }

    if (entry.count >= SEND_RATE_MAX_PER_PHONE) {
      const waitMs = SEND_RATE_WINDOW_MS - (now - entry.windowStart);
      const waitMin = Math.ceil(waitMs / 60_000);
      const err = new Error(
        `Too many verification codes requested for this phone number. Please wait ${waitMin} minute(s) before trying again.`,
      );
      err.code = "PHONE_RATE_LIMITED";
      err.statusCode = 429;
      throw err;
    }

    entry.count += 1;
  },

  /**
   * Rolls back send rate limit counter if SMS dispatch fails.
   * @param {string} phoneNumber
   */
  rollbackPhoneSendRateLimit(phoneNumber) {
    const key = String(phoneNumber || "").trim();
    const entry = phoneRateStore.get(key);
    if (entry && entry.count > 0) {
      entry.count -= 1;
      if (entry.count === 0) {
        phoneRateStore.delete(key);
      }
    }
  },

  /**
   * Creates a new pending registration session.
   * Generates a cryptographically random 6-digit OTP (stored only as SHA-256 hash)
   * and returns the plaintext OTP strictly for immediate SMS dispatch.
   *
   * @param {Object} options
   * @param {Object} options.registrationPayload - Complete validated registration fields
   * @param {string} options.phoneNumber - Normalized E.164 phone ("+639...")
   * @param {string} options.localPhoneNumber - Normalized local phone ("09...")
   * @param {string} options.email - Normalized email
   * @param {string} options.username - Normalized username
   * @param {number} [options.expirySeconds] - TTL in seconds
   * @param {number} [options.cooldownSeconds] - Resend cooldown in seconds
   * @returns {{
   *   registrationToken: string,
   *   plainOtp: string,
   *   expiresInSeconds: number,
   *   resendCooldownSeconds: number
   * }}
   */
  createPendingRegistration({
    registrationPayload,
    phoneNumber,
    localPhoneNumber,
    email,
    username,
    expirySeconds = DEFAULT_OTP_TTL_SECONDS,
    cooldownSeconds = DEFAULT_COOLDOWN_SECONDS,
  }) {
    pruneExpired();

    // Check rate limit for this phone number
    this.checkPhoneSendRateLimit(phoneNumber);

    // If an existing pending registration exists for this phone or email, invalidate it
    const existingPhoneToken = phoneIndex.get(phoneNumber);
    if (existingPhoneToken) {
      pendingStore.delete(existingPhoneToken);
    }
    const existingEmailToken = emailIndex.get(email);
    if (existingEmailToken) {
      pendingStore.delete(existingEmailToken);
    }

    const registrationToken = generateRegistrationToken();
    const plainOtp = generateCryptographicOtp();
    const now = Date.now();

    const entry = {
      registrationToken,
      registrationPayload,
      phoneNumber,
      localPhoneNumber,
      email,
      username,
      otpHash: hashOtp(plainOtp),
      expiresAt: now + expirySeconds * 1000,
      attempts: 0,
      maxAttempts: DEFAULT_MAX_ATTEMPTS,
      resendCooldownUntil: now + cooldownSeconds * 1000,
      createdAt: now,
      verified: false,
      verifiedAt: null,
      completed: false,
      completedResult: null,
    };

    pendingStore.set(registrationToken, entry);
    phoneIndex.set(phoneNumber, registrationToken);
    emailIndex.set(email, registrationToken);

    return {
      registrationToken,
      plainOtp,
      expiresInSeconds: expirySeconds,
      resendCooldownSeconds: cooldownSeconds,
    };
  },

  /**
   * Retrieves an active pending registration entry.
   * @param {string} registrationToken
   * @returns {Object|null}
   */
  getPendingRegistration(registrationToken) {
    pruneExpired();
    return pendingStore.get(String(registrationToken || "").trim()) || null;
  },

  /**
   * Resends an OTP for an existing pending registration.
   * Enforces cooldown and phone rate limits.
   * Invalidates any previously issued OTP.
   *
   * @param {string} registrationToken
   * @param {Object} [options]
   * @param {number} [options.expirySeconds]
   * @param {number} [options.cooldownSeconds]
   * @returns {{
   *   registrationToken: string,
   *   plainOtp: string,
   *   expiresInSeconds: number,
   *   resendCooldownSeconds: number
   * }}
   */
  resendOtp(
    registrationToken,
    {
      expirySeconds = DEFAULT_OTP_TTL_SECONDS,
      cooldownSeconds = DEFAULT_COOLDOWN_SECONDS,
    } = {},
  ) {
    pruneExpired();
    const token = String(registrationToken || "").trim();
    const entry = pendingStore.get(token);

    if (!entry) {
      const err = new Error("Registration session not found or has expired. Please register again.");
      err.statusCode = 404;
      throw err;
    }

    if (entry.completed) {
      const err = new Error("This registration has already been completed.");
      err.statusCode = 400;
      throw err;
    }

    if (entry.verified) {
      const err = new Error("Phone number is already verified. Please complete your registration.");
      err.statusCode = 400;
      throw err;
    }

    const now = Date.now();
    if (now < entry.resendCooldownUntil) {
      const remainingSeconds = Math.ceil((entry.resendCooldownUntil - now) / 1000);
      const err = new Error(
        `Please wait ${remainingSeconds} second(s) before requesting a new verification code.`,
      );
      err.statusCode = 429;
      err.cooldownRemainingSeconds = remainingSeconds;
      throw err;
    }

    // Rate-limit check on phone
    this.checkPhoneSendRateLimit(entry.phoneNumber);

    // Issue a brand-new cryptographically random OTP
    const plainOtp = generateCryptographicOtp();

    // Invalidate previous OTP immediately
    entry.otpHash = hashOtp(plainOtp);
    entry.attempts = 0; // reset attempts for the new code
    entry.expiresAt = now + expirySeconds * 1000;
    entry.resendCooldownUntil = now + cooldownSeconds * 1000;

    return {
      registrationToken: token,
      plainOtp,
      expiresInSeconds: expirySeconds,
      resendCooldownSeconds: cooldownSeconds,
    };
  },

  /**
   * Verifies the user-submitted OTP for a pending registration.
   * Enforces expiry, attempt limits, timing attack safe comparison.
   * On success, marks session verified and invalidates the OTP code to prevent replay attacks.
   *
   * @param {string} registrationToken
   * @param {string} otp
   * @returns {{ verified: true, pendingRegistration: Object }}
   */
  verifyOtp(registrationToken, otp) {
    pruneExpired();
    const token = String(registrationToken || "").trim();
    const entry = pendingStore.get(token);

    if (!entry) {
      const err = new Error("Verification session not found or has expired. Please register again.");
      err.statusCode = 404;
      throw err;
    }

    if (entry.completed) {
      const err = new Error("This account has already been registered and verified.");
      err.statusCode = 400;
      throw err;
    }

    if (entry.verified) {
      const err = new Error("This phone number has already been verified.");
      err.statusCode = 400;
      throw err;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.deleteRegistration(token);
      const err = new Error("Your verification code has expired. Please request a new one.");
      err.statusCode = 400;
      throw err;
    }

    if (entry.attempts >= entry.maxAttempts) {
      this.deleteRegistration(token);
      const err = new Error(
        "Too many failed verification attempts. Your session has been invalidated. Please register again.",
      );
      err.statusCode = 400;
      throw err;
    }

    const inputHash = hashOtp(otp);
    const expectedBuffer = Buffer.from(entry.otpHash, "hex");
    const inputBuffer = Buffer.from(inputHash, "hex");

    const isMatch =
      expectedBuffer.length === inputBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, inputBuffer);

    if (!isMatch) {
      entry.attempts += 1;
      const remaining = entry.maxAttempts - entry.attempts;

      if (remaining <= 0) {
        this.deleteRegistration(token);
        const err = new Error(
          "Too many failed verification attempts. Your session has been invalidated. Please register again.",
        );
        err.statusCode = 400;
        throw err;
      }

      const err = new Error(`Incorrect verification code. You have ${remaining} attempt(s) remaining.`);
      err.statusCode = 400;
      err.remainingAttempts = remaining;
      throw err;
    }

    // Success — mark verified and immediately invalidate OTP hash to prevent reuse
    entry.verified = true;
    entry.verifiedAt = now;
    entry.otpHash = null;

    return {
      verified: true,
      pendingRegistration: entry,
    };
  },

  /**
   * Completion lock to prevent race conditions during duplicate requests.
   * @param {string} registrationToken
   * @returns {boolean} true if lock acquired, false if already in progress
   */
  acquireCompletionLock(registrationToken) {
    if (inFlightCompletions.has(registrationToken)) {
      return false;
    }
    inFlightCompletions.add(registrationToken);
    return true;
  },

  /**
   * Releases completion lock.
   * @param {string} registrationToken
   */
  releaseCompletionLock(registrationToken) {
    inFlightCompletions.delete(registrationToken);
  },

  /**
   * Marks a pending registration as completed with the created user result.
   * @param {string} registrationToken
   * @param {Object} completedResult
   */
  markCompleted(registrationToken, completedResult) {
    const entry = pendingStore.get(registrationToken);
    if (entry) {
      entry.completed = true;
      entry.completedResult = completedResult;
    }
  },

  /**
   * Deletes a pending registration.
   * @param {string} registrationToken
   */
  deleteRegistration(registrationToken) {
    const entry = pendingStore.get(registrationToken);
    if (entry) {
      if (entry.phoneNumber && phoneIndex.get(entry.phoneNumber) === registrationToken) {
        phoneIndex.delete(entry.phoneNumber);
      }
      if (entry.email && emailIndex.get(entry.email) === registrationToken) {
        emailIndex.delete(entry.email);
      }
      pendingStore.delete(registrationToken);
    }
  },

  /**
   * Clear all stores (used for test teardown).
   */
  clearAll() {
    pendingStore.clear();
    phoneIndex.clear();
    emailIndex.clear();
    phoneRateStore.clear();
    inFlightCompletions.clear();
  },
};
