import dns from "node:dns";
import nodemailer from "nodemailer";
import { env } from "../config/env.js";

// Ensure IPv4 resolution takes precedence to avoid Node 18+ dual-stack connection delays
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

/**
 * Creates a configured Nodemailer transport for Gmail SMTP.
 * Sanitizes app password (stripping whitespace) and supports SSL/TLS.
 */
function createGmailTransporter(port = 465, secure = true) {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    return null;
  }

  const cleanPass = String(env.GMAIL_APP_PASSWORD).trim().replace(/\s+/g, "");
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port,
    secure,
    auth: {
      user: env.GMAIL_USER.trim(),
      pass: cleanPass,
    },
    connectionTimeout: 8000,
    greetingTimeout: 5000,
    socketTimeout: 8000,
  });
}

/**
 * Sends email directly through Gmail SMTP via Nodemailer.
 * Tries port 465 (SSL) first, falling back to port 587 (TLS) if blocked.
 */
async function sendViaGmailSmtp({ toEmail, subject, htmlContent }) {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    throw new Error("Gmail SMTP credentials (GMAIL_USER, GMAIL_APP_PASSWORD) not configured.");
  }

  const primaryTransporter = createGmailTransporter(465, true);
  try {
    const info = await primaryTransporter.sendMail({
      from: `"CitiSent Platform" <${env.GMAIL_USER.trim()}>`,
      to: toEmail,
      subject,
      html: htmlContent,
    });
    return { success: true, provider: "Gmail SMTP (Port 465)", messageId: info.messageId };
  } catch (primaryErr) {
    console.warn("[EmailService Notice] Gmail SMTP port 465 failed, attempting port 587 fallback:", primaryErr.message);
    const fallbackTransporter = createGmailTransporter(587, false);
    const fallbackInfo = await fallbackTransporter.sendMail({
      from: `"CitiSent Platform" <${env.GMAIL_USER.trim()}>`,
      to: toEmail,
      subject,
      html: htmlContent,
    });
    return { success: true, provider: "Gmail SMTP (Port 587)", messageId: fallbackInfo.messageId };
  }
}

/**
 * Sends email via Brevo's HTTPS REST API (Port 443).
 * Uses the verified sender account registered on Brevo.
 */
async function sendViaBrevo({ toEmail, recipientName, subject, htmlContent }) {
  if (!env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY not configured.");
  }

  const senderEmail = env.BREVO_SENDER_EMAIL || env.GMAIL_USER || "madriagajohneduard@gmail.com";
  const senderName = env.BREVO_SENDER_NAME || "CitiSent Platform";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": env.BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        to: [{ email: toEmail, name: recipientName || "City Administrator" }],
        subject,
        htmlContent,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errMsg = data?.message || `Brevo API returned status ${response.status}`;
      const err = new Error(errMsg);
      err.provider = "brevo";
      err.statusCode = response.status;
      throw err;
    }

    return { success: true, messageId: data?.messageId, provider: "Brevo API" };
  } catch (err) {
    clearTimeout(timer);
    console.error("[EmailService Error] Brevo send failed:", err.message);
    throw err;
  }
}

/**
 * Dispatches an official invitation email to the newly provisioned Superadmin.
 * Automatically tries Gmail SMTP (if app password is set) and Brevo HTTPS API.
 */
export async function sendSuperadminInvitationEmail({
  toEmail,
  recipientName,
  setupUrl,
  jurisdictionCity,
}) {
  const subject = `Welcome to CitiSent - Set Up Your City Superadmin Account (${jurisdictionCity || "Municipal Portal"})`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
          .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { text-align: center; margin-bottom: 24px; }
          .brand { font-size: 22px; font-weight: 800; color: #0284c7; letter-spacing: -0.5px; }
          .h1 { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 8px; margin-bottom: 8px; }
          .p { font-size: 15px; line-height: 1.6; color: #475569; margin: 12px 0; }
          .btn-container { text-align: center; margin: 28px 0; }
          .btn { display: inline-block; background-color: #0284c7; color: #ffffff !important; text-decoration: none; padding: 12px 28px; font-weight: 600; font-size: 15px; border-radius: 8px; }
          .link-box { background-color: #f1f5f9; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 13px; word-break: break-all; color: #334155; margin-top: 16px; }
          .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="brand">CITISENT CIVIC PLATFORM</div>
            <div class="h1">Official Superadmin Account Invitation</div>
          </div>
          <p class="p">Hello <strong>${recipientName || "City Administrator"}</strong>,</p>
          <p class="p">
            An official <strong>City Superadmin</strong> account has been provisioned for you for <strong>${jurisdictionCity || "your municipality"}</strong> on the CitiSent civic reporting platform.
          </p>
          <p class="p">
            Please complete your account activation and set your private administrative password by clicking the button below:
          </p>
          <div class="btn-container">
            <a href="${setupUrl}" class="btn" target="_blank">Activate Account & Set Password</a>
          </div>
          <p class="p" style="font-size: 13px;">If the button does not work, copy and paste this link into your browser:</p>
          <div class="link-box">${setupUrl}</div>
          <p class="p" style="font-size: 13px; color: #64748b; margin-top: 20px;">
            * This activation link will expire in 7 days for security. If you did not expect this invitation, please contact your municipal IT lead.
          </p>
          <div class="footer">
            &copy; CitiSent Platform Operations. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  let lastError = null;

  // 1. If Gmail SMTP credentials (GMAIL_USER & GMAIL_APP_PASSWORD) are configured, attempt Gmail SMTP first
  if (env.GMAIL_USER && env.GMAIL_APP_PASSWORD) {
    try {
      const res = await sendViaGmailSmtp({ toEmail, subject, htmlContent });
      return res;
    } catch (smtpErr) {
      console.warn("[EmailService Notice] Gmail SMTP attempt failed:", smtpErr.message);
      lastError = smtpErr.message;
    }
  }

  // 2. Brevo HTTPS REST API (Port 443) - primary or fallback provider
  if (env.BREVO_API_KEY) {
    try {
      const res = await sendViaBrevo({ toEmail, recipientName, subject, htmlContent });
      return res;
    } catch (brevoErr) {
      console.warn("[EmailService Notice] Brevo API attempt failed:", brevoErr.message);
      lastError = brevoErr.message;
    }
  }

  // 3. Fallback: Development Simulation
  console.warn(`[EmailService Notice] Email dispatch simulated for ${toEmail}. Reason: ${lastError || "No credentials configured"}`);
  console.log(`[EmailService Notice] Setup URL: ${setupUrl}`);
  return {
    success: false,
    simulated: true,
    error: lastError || "No active email credentials configured.",
  };
}
