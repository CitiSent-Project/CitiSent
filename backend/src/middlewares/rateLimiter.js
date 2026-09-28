import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

function getRetryAfterSeconds(req, options) {
  const resetTime = req.rateLimit?.resetTime;
  if (resetTime instanceof Date) {
    return Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
  }
  return Math.max(1, Math.ceil((options.windowMs || 900000) / 1000));
}

export function createRateLimitHandler(getMessage) {
  return (req, res, _next, options) => {
    const retryAfterSeconds = getRetryAfterSeconds(req, options);
    const retryAfterMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));

    const message =
      typeof getMessage === "function"
        ? getMessage({ retryAfterSeconds, retryAfterMinutes })
        : getMessage ||
          `Too many requests. Please try again after ${retryAfterMinutes} minute(s).`;

    res.setHeader("Retry-After", String(retryAfterSeconds));

    return res.status(options.statusCode || 429).json({
      success: false,
      code: "TOO_MANY_REQUESTS",
      message,
      retryAfterSeconds,
    });
  };
}

const windowMs = env.AUTH_RATE_LIMIT_WINDOW_MS;
const accountMax = env.AUTH_LOGIN_RATE_LIMIT_MAX;
const ipMax = env.AUTH_LOGIN_IP_RATE_LIMIT_MAX;

const shouldSkipInTest = (req) =>
  process.env.NODE_ENV === "test" &&
  req.headers["x-test-bypass-rate-limit"] === "true";

/**
 * IP-level login rate limiter:
 * Protects against large-scale password spraying from a single IP address.
 * Only failed login attempts (HTTP >= 400) count against the quota.
 */
export const loginIpRateLimiter = rateLimit({
  windowMs,
  limit: ipMax,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: shouldSkipInTest,
  handler: createRateLimitHandler(
    ({ retryAfterMinutes }) =>
      `Too many failed login attempts from this network. Please try again after ${retryAfterMinutes} minute(s).`,
  ),
});

/**
 * Account-level login rate limiter:
 * Protects a specific user account against distributed brute-force attacks across rotating IPs.
 * Keyed by normalized identifier (email, username, or phone number).
 * Only failed login attempts (HTTP >= 400) count against the quota.
 */
export const loginAccountRateLimiter = rateLimit({
  windowMs,
  limit: accountMax,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  validate: { ip: false },
  skip: shouldSkipInTest,
  keyGenerator: (req) => {
    const raw =
      req.body?.identifier ||
      req.body?.email ||
      req.body?.username ||
      req.body?.phoneNumber ||
      "";
    const normalized = String(raw).trim().toLowerCase();
    return normalized ? `account:${normalized}` : `ip:${req.ip}`;
  },
  handler: createRateLimitHandler(
    ({ retryAfterMinutes }) =>
      `Too many failed login attempts for this account. Please wait ${retryAfterMinutes} minute(s) before trying again.`,
  ),
});

/** Combined array for Express routes: runs IP limiter then account limiter */
export const loginRateLimiter = [loginIpRateLimiter, loginAccountRateLimiter];

/**
 * OTP Request rate limiter:
 * Limits requesting OTP codes to prevent email spam / SMS flooding.
 */
export const otpRequestRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: shouldSkipInTest,
  handler: createRateLimitHandler(
    ({ retryAfterMinutes }) =>
      `Too many verification code requests. Please wait ${retryAfterMinutes} minute(s) before requesting another code.`,
  ),
});

/**
 * OTP Verification rate limiter:
 * Limits guessing 6-digit OTP codes. Only failed attempts count.
 */
export const otpVerifyRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: shouldSkipInTest,
  handler: createRateLimitHandler(
    ({ retryAfterMinutes }) =>
      `Too many incorrect verification attempts. Please wait ${retryAfterMinutes} minute(s) before trying again.`,
  ),
});

/**
 * Registration rate limiter:
 * Prevents automated account creation spam (max 5 accounts per hour per IP).
 */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: shouldSkipInTest,
  handler: createRateLimitHandler(
    ({ retryAfterMinutes }) =>
      `Too many account registration attempts. Please try again after ${retryAfterMinutes} minute(s).`,
  ),
});

/**
 * Password reset execution rate limiter:
 * Prevents brute-forcing reset tokens. Only failed attempts count.
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: shouldSkipInTest,
  handler: createRateLimitHandler(
    ({ retryAfterMinutes }) =>
      `Too many password reset attempts. Please try again after ${retryAfterMinutes} minute(s).`,
  ),
});
