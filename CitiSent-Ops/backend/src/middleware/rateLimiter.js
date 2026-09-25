import rateLimit from "express-rate-limit";

/**
 * Rate Limiter for Developer Registration (`POST /api/v1/ops/register-dev`)
 * Strict constraints to prevent brute-forcing email addresses against the whitelist.
 * 
 * Rules: 5 requests per 15-minute window per IP.
 */
export const developerRegistrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, 
  message: {
    success: false,
    error: "Too many registration attempts from this IP. Please try again after 15 minutes.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Rate Limiter for Superadmin Provisioning (`POST /api/v1/ops/superadmins`)
 * Moderate constraints to prevent spamming Superadmin invites.
 * 
 * Rules: 10 requests per 10-minute window per IP.
 */
export const superadminProvisioningLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  message: {
    success: false,
    error: "Too many superadmin provision attempts. Please try again after 10 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
