import dns from "node:dns";
import nodemailer from "nodemailer";
import shared from "nodemailer/lib/shared/index.js";
import { StatusCodes } from "http-status-codes";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { AppError } from "../errors/appError.js";

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

  return {
    category,
    diagnostic,
    code: code || null,
    responseCode: responseCode || null,
  };
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
      `Email delivery is not configured. Missing environment variable(s): ${missing.join(", ")}.`,
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
  requireSmtpConfig();

  return {
    async sendMail(mailOptions) {
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
            <p style="color: #4b5563; font-size: 15px; margin-bottom: 20px;">
              Use the verification code below to continue:
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <div style="display: inline-block; background-color: #f0f4ff; border: 2px dashed #a5b4fc; border-radius: 12px; padding: 20px 40px;">
                <span style="font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #1d4ed8; font-family: monospace;">${safeOtp}</span>
              </div>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-bottom: 0;">
              <strong>This code expires in 5 minutes.</strong><br/>
              Do not share this code with anyone.
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

export const mailerService = {
  sendOtpEmail: async (args) => sendOtpEmail(args),
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
