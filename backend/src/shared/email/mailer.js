import dns from "node:dns";
import { createRequire } from "node:module";
import nodemailer from "nodemailer";
import { StatusCodes } from "http-status-codes";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { AppError } from "../errors/appError.js";

const require = createRequire(import.meta.url);
const shared = require("nodemailer/lib/shared/index.js");

// Ensure IPv4 resolution takes precedence in Node's default resolver
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

// Strictly enforce IPv4 across Nodemailer.
// In Linux containers (e.g., Render Docker containers), eth0 has an IPv6 link-local address
// which tricks Nodemailer's isFamilySupported(6) into returning true. Nodemailer then queries
// AAAA records and randomly selects an unreachable IPv6 address, failing with ENETUNREACH.
if (shared && shared.networkInterfaces) {
  for (const key of Object.keys(shared.networkInterfaces)) {
    if (Array.isArray(shared.networkInterfaces[key])) {
      shared.networkInterfaces[key] = shared.networkInterfaces[key].filter(
        (iface) => iface.family === "IPv4" || iface.family === 4,
      );
    }
  }
}

// Intercept Nodemailer's hostname resolution to guarantee IPv4-only address selection
if (shared && typeof shared.resolveHostname === "function") {
  const originalResolveHostname = shared.resolveHostname;
  shared.resolveHostname = function (options, callback) {
    return originalResolveHostname.call(this, options, (err, resolved) => {
      if (err) return callback(err);
      if (resolved && Array.isArray(resolved._addresses)) {
        const ipv4Addresses = resolved._addresses.filter(
          (addr) => typeof addr === "string" && !addr.includes(":"),
        );
        if (ipv4Addresses.length > 0) {
          resolved._addresses = ipv4Addresses;
          if (!resolved.host || resolved.host.includes(":")) {
            resolved.host = ipv4Addresses[Math.floor(Math.random() * ipv4Addresses.length)];
          }
        }
      }
      return callback(null, resolved);
    });
  };
}

/**
 * Masks an email address for safe logging (e.g., m***8@gmail.com).
 * Never exposes full user identifiers or secrets in application logs.
 */
export function maskEmail(email) {
  if (!email || typeof email !== "string") return "***";
  const [local, domain] = email.trim().toLowerCase().split("@");
  if (!domain) return "***";
  const maskedLocal =
    local.length <= 2
      ? `${local[0]}*`
      : `${local[0]}${"*".repeat(Math.max(1, local.length - 2))}${local[local.length - 1]}`;
  return `${maskedLocal}@${domain}`;
}

/**
 * Classifies underlying mail provider errors into structured diagnostic categories
 * while ensuring no passwords, tokens, or raw secrets are leaked.
 */
export function classifyAndSanitizeSmtpError(err) {
  const code = String(err?.code || "").toUpperCase();
  const message = String(err?.message || "");
  const responseCode = err?.responseCode || null;

  let category = "UNKNOWN_ERROR";
  let diagnostic = "An unexpected error occurred while communicating with the mail server.";

  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    category = "MISSING_ENV_VARS";
    const missing = [];
    if (!env.GMAIL_USER) missing.push("GMAIL_USER");
    if (!env.GMAIL_APP_PASSWORD) missing.push("GMAIL_APP_PASSWORD");
    diagnostic = `Missing required email environment variable(s): ${missing.join(", ")}`;
  } else if (
    code === "EAUTH" ||
    responseCode === 535 ||
    message.includes("535") ||
    message.toLowerCase().includes("badcredentials") ||
    message.toLowerCase().includes("username and password not accepted")
  ) {
    category = "AUTHENTICATION_FAILED";
    diagnostic =
      "Gmail SMTP authentication failed (535). Verify GMAIL_USER and GMAIL_APP_PASSWORD (must use a 16-character Google App Password without spaces, not your regular account password).";
  } else if (
    code === "ETIMEDOUT" ||
    code === "ESOCKETTIMEDOUT" ||
    message.toLowerCase().includes("timeout") ||
    message.toLowerCase().includes("timed out")
  ) {
    category = "CONNECTION_TIMEOUT";
    diagnostic = `SMTP connection timed out connecting to ${env.SMTP_HOST || "smtp.gmail.com"}:${env.SMTP_PORT || 465}. The host or port may be restricted by the platform firewall.`;
  } else if (
    code === "ENETUNREACH" ||
    code === "ECONNREFUSED" ||
    code === "ECONNRESET" ||
    code === "ENOTFOUND"
  ) {
    category = "NETWORK_UNREACHABLE";
    diagnostic = `SMTP network error (${code}): unable to establish socket connection with ${env.SMTP_HOST || "smtp.gmail.com"}:${env.SMTP_PORT || 465}.`;
  } else if (
    responseCode === 550 ||
    responseCode === 553 ||
    message.includes("550") ||
    message.includes("553")
  ) {
    category = "RECIPIENT_REJECTED";
    diagnostic = `SMTP rejection (${responseCode || code}): recipient or sender address was rejected by the mail server.`;
  } else if (
    code === "ESOCKET" ||
    message.toLowerCase().includes("ssl") ||
    message.toLowerCase().includes("tls") ||
    message.toLowerCase().includes("handshake")
  ) {
    category = "TLS_HANDSHAKE_ERROR";
    diagnostic = `TLS handshake failed (${code}): ${message.slice(0, 100)}`;
  } else if (responseCode === 421 || responseCode === 451 || responseCode === 452) {
    category = "PROVIDER_RATE_LIMITED";
    diagnostic = `Mail provider temporary rate limit or quota exceeded (${responseCode}).`;
  } else {
    diagnostic = message ? message.slice(0, 150) : "Unknown mail delivery failure";
  }

  if (err?.provider === "resend" || err?.provider === "brevo") {
    const provName = err.provider === "resend" ? "Resend" : "Brevo";
    if (err.statusCode === 401 || err.statusCode === 403) {
      return {
        category: "AUTHENTICATION_FAILED",
        diagnostic: `${provName} API authentication failed (${err.statusCode}). Check your ${err.provider === "resend" ? "RESEND_API_KEY" : "BREVO_API_KEY"}.`,
        code: String(err.statusCode),
        responseCode: err.statusCode,
      };
    }
    if (err.statusCode === 429) {
      return {
        category: "PROVIDER_RATE_LIMITED",
        diagnostic: `${provName} API rate limit exceeded (429).`,
        code: "429",
        responseCode: 429,
      };
    }
    return {
      category: "PROVIDER_API_ERROR",
      diagnostic: `${provName} API error: ${message.slice(0, 150)}`,
      code: String(err.statusCode || code || "API_ERROR"),
      responseCode: err.statusCode || responseCode || null,
    };
  }

  return {
    category,
    diagnostic,
    code: code || null,
    responseCode: responseCode || null,
  };
}

/**
 * Returns the active email delivery provider based on available configuration.
 * Prioritizes HTTP APIs (Resend, Brevo) to avoid Render's SMTP port restrictions.
 */
export function getActiveEmailProvider() {
  if (env.RESEND_API_KEY) return "resend";
  if (env.BREVO_API_KEY) return "brevo";
  return "smtp";
}

/**
 * Validates that at least one email delivery mechanism is configured.
 */
export function requireEmailConfig() {
  const provider = getActiveEmailProvider();
  if (provider === "resend" || provider === "brevo") {
    return;
  }
  requireSmtpConfig();
}

/**
 * Sends an email via Resend's HTTPS REST API (Port 443).
 * Immune to cloud firewall blocks on ports 25, 465, and 587.
 */
export async function sendViaResend({ to, subject, html, text, from }) {
  const fromAddress = env.RESEND_FROM_EMAIL || from || "CitiSent <onboarding@resend.dev>";
  const toList = Array.isArray(to) ? to : [to];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: toList,
        subject,
        html,
        text,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const err = new Error(data?.message || `Resend API returned status ${response.status}`);
      err.provider = "resend";
      err.statusCode = response.status;
      err.responseCode = response.status;
      throw err;
    }

    return { messageId: data?.id, provider: "resend" };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      const timeoutErr = new Error("Resend HTTP request timed out after 8000ms");
      timeoutErr.code = "ETIMEDOUT";
      timeoutErr.provider = "resend";
      throw timeoutErr;
    }
    throw err;
  }
}

/**
 * Sends an email via Brevo's (formerly Sendinblue) HTTPS REST API (Port 443).
 * Immune to cloud firewall blocks on ports 25, 465, and 587.
 */
export async function sendViaBrevo({ to, subject, html, text, recipientName }) {
  const senderEmail = env.GMAIL_USER || "citisent.app@gmail.com";
  const toList = Array.isArray(to)
    ? to.map((email) => ({ email, name: recipientName || "CitiSent User" }))
    : [{ email: to, name: recipientName || "CitiSent User" }];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": env.BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: "CitiSent" },
        to: toList,
        subject,
        htmlContent: html,
        textContent: text,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const err = new Error(data?.message || `Brevo API returned status ${response.status}`);
      err.provider = "brevo";
      err.statusCode = response.status;
      err.responseCode = response.status;
      throw err;
    }

    return { messageId: data?.messageId, provider: "brevo" };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      const timeoutErr = new Error("Brevo HTTP request timed out after 8000ms");
      timeoutErr.code = "ETIMEDOUT";
      timeoutErr.provider = "brevo";
      throw timeoutErr;
    }
    throw err;
  }
}

/**
 * Validates SMTP environment variables needed to connect and send emails.
 * Distinct from web URL validation so OTP flows are never blocked by WEB_APP_BASE_URL.
 */
export function requireSmtpConfig() {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    const missing = [];
    if (!env.GMAIL_USER) missing.push("GMAIL_USER");
    if (!env.GMAIL_APP_PASSWORD) missing.push("GMAIL_APP_PASSWORD");
    throw new AppError(
      `Email delivery is not configured. Missing environment variable(s): ${missing.join(", ")} (or configure RESEND_API_KEY / BREVO_API_KEY).`,
      StatusCodes.SERVICE_UNAVAILABLE,
    );
  }
}

/**
 * Validates Web App URL needed only for web-based activation/reset password links.
 */
export function requireWebUrlConfig() {
  if (!env.WEB_APP_BASE_URL) {
    throw new AppError(
      "Web application URL is not configured. Set WEB_APP_BASE_URL.",
      StatusCodes.SERVICE_UNAVAILABLE,
    );
  }
}

function getCleanCredentials() {
  requireSmtpConfig();
  return {
    user: String(env.GMAIL_USER || "").trim(),
    pass: String(env.GMAIL_APP_PASSWORD || "").trim().replace(/\s+/g, ""),
  };
}

function createTransportInstance(port, secure) {
  const credentials = getCleanCredentials();
  const host = env.SMTP_HOST || "smtp.gmail.com";
  return nodemailer.createTransport({
    host,
    port,
    secure,
    servername: host,
    auth: credentials,
    connectionTimeout: 6000,
    greetingTimeout: 4000,
    socketTimeout: 6000,
  });
}

let primaryTransporter = null;
let fallbackTransporter = null;

export function resetTransportersForTesting() {
  primaryTransporter = null;
  fallbackTransporter = null;
}

function getPrimaryTransporter() {
  requireSmtpConfig();
  if (!primaryTransporter) {
    primaryTransporter = createTransportInstance(env.SMTP_PORT || 465, env.SMTP_SECURE !== false);
  }
  return primaryTransporter;
}

function getFallbackTransporter() {
  requireSmtpConfig();
  if (!fallbackTransporter) {
    const isPrimary465 = (env.SMTP_PORT || 465) === 465;
    const fallbackPort = isPrimary465 ? 587 : 465;
    const fallbackSecure = fallbackPort === 465;
    fallbackTransporter = createTransportInstance(fallbackPort, fallbackSecure);
  }
  return fallbackTransporter;
}

export function getTransporter() {
  return {
    async sendMail(mailOptions) {
      // 1. If Resend HTTP API is configured, use it (runs over HTTPS Port 443, never blocked by Render)
      if (env.RESEND_API_KEY) {
        try {
          return await sendViaResend(mailOptions);
        } catch (resendErr) {
          const classified = classifyAndSanitizeSmtpError(resendErr);
          logger.error("[MAILER] Resend HTTP send failed", {
            category: classified.category,
            diagnostic: classified.diagnostic,
            code: classified.code,
          });
          throw resendErr;
        }
      }

      // 2. If Brevo HTTP API is configured, use it (runs over HTTPS Port 443, never blocked by Render)
      if (env.BREVO_API_KEY) {
        try {
          return await sendViaBrevo(mailOptions);
        } catch (brevoErr) {
          const classified = classifyAndSanitizeSmtpError(brevoErr);
          logger.error("[MAILER] Brevo HTTP send failed", {
            category: classified.category,
            diagnostic: classified.diagnostic,
            code: classified.code,
          });
          throw brevoErr;
        }
      }

      // 3. Fallback to direct SMTP (for local development or environments with unblocked SMTP ports)
      requireSmtpConfig();
      const primary = getPrimaryTransporter();
      const primaryPort = env.SMTP_PORT || 465;
      try {
        return await primary.sendMail(mailOptions);
      } catch (primaryErr) {
        const primaryClassified = classifyAndSanitizeSmtpError(primaryErr);
        logger.warn(`[MAILER] Primary SMTP attempt failed on port ${primaryPort}`, {
          category: primaryClassified.category,
          diagnostic: primaryClassified.diagnostic,
          code: primaryClassified.code,
        });

        const fallback = getFallbackTransporter();
        try {
          return await fallback.sendMail(mailOptions);
        } catch (fallbackErr) {
          const fallbackClassified = classifyAndSanitizeSmtpError(fallbackErr);
          logger.error(`[MAILER] Fallback SMTP attempt also failed`, {
            category: fallbackClassified.category,
            diagnostic: fallbackClassified.diagnostic,
            code: fallbackClassified.code,
          });
          throw primaryErr;
        }
      }
    },
  };
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildSetupPasswordUrl(token) {
  requireWebUrlConfig();
  const url = new URL("/setup-password", env.WEB_APP_BASE_URL);
  url.searchParams.set("token", token);
  return url.toString();
}

export function buildResetPasswordUrl(token) {
  requireWebUrlConfig();
  const url = new URL("/reset-password", env.WEB_APP_BASE_URL);
  url.searchParams.set("token", token);
  return url.toString();
}

export async function sendPasswordResetEmail({ toEmail, recipientName, resetUrl }) {
  const safeName = escapeHtml(recipientName || "CitiSent user");

  await getTransporter().sendMail({
    from: `"CitiSent" <${env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Reset your CitiSent password",
    text: [
      `Hello ${recipientName || "there"},`,
      "",
      "We received a request to reset your CitiSent account password.",
      "",
      "Use this secure link within 1 hour to choose a new password:",
      resetUrl,
      "",
      "If you did not request this, you can safely ignore this email. Your password will remain unchanged.",
    ].join("\n"),
    html: `
      <div style="font-family: 'Poppins', Helvetica, Arial, sans-serif; background-color: #eef2f8; padding: 40px 20px; color: #1f2937; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <div style="background-color: #1d4ed8; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">CitiSent</h1>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="margin-top: 0; color: #1f2937; font-size: 20px; font-weight: 600;">Hello ${safeName},</h2>
            <p style="color: #4b5563; font-size: 16px; margin-bottom: 24px;">
              We received a request to reset your CitiSent account password.
            </p>
            <p style="color: #4b5563; font-size: 16px; margin-bottom: 32px;">
              To choose a new password, please click the button below:
            </p>
            
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${escapeHtml(resetUrl)}" style="display: inline-block; background-color: #1d4ed8; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Your Password</a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
              <strong>Note:</strong> This secure link will expire in 1 hour.
            </p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 13px; margin: 0;">
              If you did not request this reset, you can safely ignore this email.
            </p>
            <p style="color: #94a3b8; font-size: 13px; margin: 8px 0 0 0;">
              &copy; ${new Date().getFullYear()} CitiSent. All rights reserved.
            </p>
          </div>
          
        </div>
      </div>
    `,
  });
}

export async function sendOtpEmail({ toEmail, recipientName, otp }) {
  const safeName = escapeHtml(recipientName || "CitiSent user");
  const safeOtp = escapeHtml(String(otp));

  await getTransporter().sendMail({
    from: `"CitiSent" <${env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Your CitiSent password reset code",
    text: [
      `Hello ${recipientName || "there"},`,
      "",
      "Your one-time password reset code is:",
      "",
      `  ${otp}`,
      "",
      "This code expires in 5 minutes. Do not share it with anyone.",
      "",
      "If you did not request this, you can safely ignore this email.",
    ].join("\n"),
    html: `
      <div style="margin:0; padding:32px 16px; background:#edf5f7; color:#183042; font-family:Arial,Helvetica,sans-serif; line-height:1.5;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #dce8ec; border-radius:18px; overflow:hidden;">
          <tr><td style="padding:28px 32px; background:#173f75; text-align:left;">
            <div style="color:#ffffff; font-size:24px; font-weight:700; letter-spacing:.2px;">CitiSent</div>
            <div style="margin-top:5px; color:#c9e9ef; font-size:13px;">Secure account recovery</div>
          </td></tr>
          <tr><td style="padding:36px 32px 32px;">
            <p style="margin:0 0 8px; color:#173f75; font-size:14px; font-weight:700; letter-spacing:.5px; text-transform:uppercase;">Password reset</p>
            <h1 style="margin:0 0 16px; color:#152b3b; font-size:26px; line-height:1.2; font-weight:700;">Hello ${safeName},</h1>
            <p style="margin:0 0 12px; color:#4c6270; font-size:16px;">We received a request to reset your CitiSent account password.</p>
            <p style="margin:0; color:#4c6270; font-size:16px;">Enter this one-time verification code to continue:</p>
            <div style="margin:28px 0; padding:22px 16px; border:1px solid #cfe1ea; border-radius:14px; background:#f2f8fb; text-align:center;">
              <div style="color:#173f75; font-family:Consolas,'Courier New',monospace; font-size:34px; font-weight:700; letter-spacing:8px; line-height:1.2;">${safeOtp}</div>
            </div>
            <p style="margin:0; color:#536b78; font-size:14px; text-align:center;"><strong>This code expires in 5 minutes.</strong><br/>Never share it with anyone.</p>
          </td></tr>
          <tr><td style="padding:22px 32px; border-top:1px solid #e5eef1; background:#f8fbfc;">
            <p style="margin:0; color:#6b7f89; font-size:13px; line-height:1.6;">If you did not request this reset, you can safely ignore this email.</p>
            <p style="margin:10px 0 0; color:#91a3ab; font-size:12px;">&copy; ${new Date().getFullYear()} CitiSent. All rights reserved.</p>
          </td></tr>
        </table>
      </div>
    `,
  });
}

export async function sendLoginOtpEmail({ toEmail, recipientName, otp }) {
  const safeName = escapeHtml(recipientName || "Administrator");
  const safeOtp = escapeHtml(String(otp));

  if (!env.GMAIL_USER && !env.RESEND_API_KEY && !env.BREVO_API_KEY) {
    if (!env.isProduction) {
      console.log(`[ADMIN LOGIN OTP EMAIL] Verification code for ${toEmail}: ${otp}`);
    }
    return { sent: true, mode: "mock" };
  }

  await getTransporter().sendMail({
    from: `"CitiSent Security" <${env.GMAIL_USER || "noreply@citisent.gov.ph"}>`,
    to: toEmail,
    subject: "CitiSent Admin Portal — 2FA Verification Code",
    text: [
      `Hello ${recipientName || "Administrator"},`,
      "",
      "A sign-in attempt was initiated for your CitiSent administrator account.",
      "",
      `Your one-time verification code is: ${otp}`,
      "",
      "This code expires in 8 hours.",
      "",
      "If you did not initiate this sign-in attempt, please notify your Superadmin or IT department immediately.",
    ].join("\n"),
    html: `
      <div style="margin:0; padding:32px 16px; background:#edf5f7; color:#183042; font-family:Arial,Helvetica,sans-serif; line-height:1.5;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #dce8ec; border-radius:18px; overflow:hidden; box-shadow:0 10px 25px rgba(23,63,117,0.08);">
          <tr><td style="padding:28px 32px; background:#173f75; text-align:left;">
            <div style="color:#ffffff; font-size:24px; font-weight:700; letter-spacing:.2px;">CitiSent</div>
            <div style="margin-top:5px; color:#c9e9ef; font-size:13px;">Administrative Portal Security</div>
          </td></tr>
          <tr><td style="padding:36px 32px 32px;">
            <p style="margin:0 0 8px; color:#173f75; font-size:13px; font-weight:700; letter-spacing:.6px; text-transform:uppercase;">Two-Factor Authentication</p>
            <h1 style="margin:0 0 16px; color:#152b3b; font-size:24px; line-height:1.2; font-weight:700;">Hello ${safeName},</h1>
            <p style="margin:0 0 12px; color:#4c6270; font-size:15px;">A sign-in attempt was initiated for your CitiSent administrator account.</p>
            <p style="margin:0; color:#4c6270; font-size:15px;">Enter this 6-digit verification code to complete your login:</p>
            <div style="margin:26px 0; padding:20px 16px; border:2px dashed #9bc3e2; border-radius:14px; background:#f2f8fb; text-align:center;">
              <div style="color:#173f75; font-family:Consolas,'Courier New',monospace; font-size:36px; font-weight:800; letter-spacing:10px; line-height:1.2;">${safeOtp}</div>
            </div>
            <p style="margin:0; color:#536b78; font-size:13px; text-align:center;">
              <strong>This code expires in 8 hours.</strong><br/>
              Never share this code with anyone.
            </p>
          </td></tr>
          <tr><td style="padding:20px 32px; border-top:1px solid #e5eef1; background:#f8fbfc;">
            <p style="margin:0; color:#e02424; font-size:12px; line-height:1.5;">
              <strong>Security Notice:</strong> If you did not initiate this sign-in attempt, please notify your Superadmin or IT department immediately.
            </p>
            <p style="margin:10px 0 0; color:#91a3ab; font-size:12px;">&copy; ${new Date().getFullYear()} CitiSent. All rights reserved.</p>
          </td></tr>
        </table>
      </div>
    `,
  });

  return { sent: true };
}

export const mailerService = {
  sendOtpEmail: async (args) => sendOtpEmail(args),
  sendLoginOtpEmail: async (args) => sendLoginOtpEmail(args),
  sendPasswordResetEmail: async (args) => sendPasswordResetEmail(args),
  sendAccountInvitationEmail: async (args) => sendAccountInvitationEmail(args),
  sendGuestVerificationOtpEmail: async ({ toEmail, otp }) => {
    const safeOtp = escapeHtml(String(otp));

    // If email credentials are not configured or in test/dev, log safely and don't block
    if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
      if (!env.isProduction) {
        console.log(`[GUEST OTP EMAIL] Verification code for ${toEmail}: ${otp}`);
      }
      return { sent: true, mode: "mock" };
    }

    await getTransporter().sendMail({
      from: `"CitiSent" <${env.GMAIL_USER}>`,
      to: toEmail,
      subject: "Your CitiSent verification code",
      text: [
        "CitiSent",
        "",
        `Your verification code is: ${otp}`,
        "",
        "This code expires in 5 minutes.",
        "",
        "If you did not request this code, you can ignore this email.",
      ].join("\n"),
      html: `
        <div style="font-family: 'Poppins', Helvetica, Arial, sans-serif; background-color: #eef2f8; padding: 40px 20px; color: #1f2937; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #1d4ed8; padding: 26px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 1px;">CitiSent</h1>
            </div>
            <div style="padding: 36px 30px;">
              <h2 style="margin-top: 0; color: #1f2937; font-size: 19px; font-weight: 600;">Guest Account Verification</h2>
              <p style="color: #4b5563; font-size: 15px; margin-bottom: 20px;">
                To help prevent spam and false reports, please use the verification code below to verify your account before submitting your report:
              </p>
              <div style="text-align: center; margin: 28px 0;">
                <div style="display: inline-block; background-color: #f0f4ff; border: 2px dashed #a5b4fc; border-radius: 12px; padding: 18px 36px;">
                  <span style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8; font-family: monospace;">${safeOtp}</span>
                </div>
              </div>
              <p style="color: #6b7280; font-size: 14px; text-align: center; margin-bottom: 0;">
                <strong>This code expires in 5 minutes.</strong><br/>
                If you did not request this code, you can safely ignore this email.
              </p>
            </div>
            <div style="background-color: #f8fafc; padding: 18px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                &copy; ${new Date().getFullYear()} CitiSent. Sto. Tomas City, Batangas.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    return { sent: true };
  },
};

export async function sendGuestVerificationOtpEmail(args) {
  return mailerService.sendGuestVerificationOtpEmail(args);
}


export async function sendAccountInvitationEmail({
  toEmail,
  recipientName,
  username,
  setupUrl,
}) {
  const safeName = escapeHtml(recipientName || "CitiSent user");
  const safeUsername = escapeHtml(username);

  await getTransporter().sendMail({
    from: `"CitiSent" <${env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Set up your CitiSent account",
    text: [
      `Hello ${recipientName || "there"},`,
      "",
      "An administrator created a CitiSent account for you. Welcome to the platform!",
      "",
      `Your CitiSent admin username: ${username}`,
      "",
      "Use this secure link within 24 hours to choose your password:",
      setupUrl,
      "",
      "If you did not expect this invitation, you can safely ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family: 'Poppins', Helvetica, Arial, sans-serif; background-color: #eef2f8; padding: 40px 20px; color: #1f2937; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <div style="background-color: #1d4ed8; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">CitiSent</h1>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="margin-top: 0; color: #1f2937; font-size: 20px; font-weight: 600;">Hello ${safeName},</h2>
            <p style="color: #4b5563; font-size: 16px; margin-bottom: 24px;">
              An administrator has created a new CitiSent admin account for you. Welcome to the portal!
            </p>
            <p style="color: #4b5563; font-size: 16px; margin-bottom: 24px;">
              Your admin username is <strong>${safeUsername}</strong>. Keep it to sign in after setting your password.
            </p>
            <p style="color: #4b5563; font-size: 16px; margin-bottom: 32px;">
              To get started, please choose a secure password by clicking the button below:
            </p>
            
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${escapeHtml(setupUrl)}" style="display: inline-block; background-color: #1d4ed8; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Set Up Your Password</a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
              <strong>Note:</strong> This secure link will expire in 24 hours.
            </p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 13px; margin: 0;">
              If you did not expect this invitation, you can safely ignore this email.
            </p>
            <p style="color: #94a3b8; font-size: 13px; margin: 8px 0 0 0;">
              &copy; ${new Date().getFullYear()} CitiSent. All rights reserved.
            </p>
          </div>
          
        </div>
      </div>
    `,
  });
}
