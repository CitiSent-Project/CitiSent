import { env } from "../../config/env.js";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Verifies a Cloudflare Turnstile token against Cloudflare's server-side API.
 *
 * The secret key is read from the backend environment and is NEVER sent to
 * the client. Turnstile tokens are single-use and expire after ~300 seconds.
 *
 * @param {string} token   - The token received from the mobile client.
 * @param {string} [remoteip] - Optional client IP address for extra binding.
 * @returns {Promise<{ success: boolean, errorCodes: string[] }>}
 */
export async function verifyTurnstileToken(token, remoteip = null) {
  const secretKey = env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

  // In development / non-production mode, accept mock dev tokens or skip if no secret key
  if (!env.isProduction) {
    if (!secretKey || token === "mock-dev-turnstile-token") {
      console.warn(
        "[Turnstile] Non-production mode: Skipping Cloudflare CAPTCHA verification " +
          `(${!secretKey ? "no secret key" : "mock dev token"}).`
      );
      return { success: true, errorCodes: [], skipped: true };
    }
  }

  if (!secretKey) {
    // In production, no secret key is a hard failure.
    return {
      success: false,
      errorCodes: ["missing-secret-key"],
      skipped: false,
    };
  }

  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return { success: false, errorCodes: ["missing-input-response"], skipped: false };
  }

  const body = new URLSearchParams({
    secret: secretKey,
    response: token.trim(),
  });

  if (remoteip && typeof remoteip === "string") {
    body.append("remoteip", remoteip);
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      signal: AbortSignal.timeout(8000), // 8 second timeout
    });

    if (!response.ok) {
      return {
        success: false,
        errorCodes: [`cloudflare-http-${response.status}`],
        skipped: false,
      };
    }

    const json = await response.json();

    return {
      success: Boolean(json.success),
      errorCodes: Array.isArray(json["error-codes"]) ? json["error-codes"] : [],
      skipped: false,
    };
  } catch (error) {
    // Network/timeout errors — do not silently allow through in production
    return {
      success: false,
      errorCodes: ["cloudflare-network-error"],
      skipped: false,
      networkError: error?.message || String(error),
    };
  }
}
