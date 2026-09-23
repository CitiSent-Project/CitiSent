import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter = null;

if (env.GMAIL_USER && env.GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.GMAIL_USER,
      pass: env.GMAIL_APP_PASSWORD,
    },
  });
}

/**
 * Sends email via Brevo's HTTPS REST API (Port 443).
 * Immune to ISP and cloud provider SMTP port blocks (ports 25, 465, 587).
 */
async function sendViaBrevo({ toEmail, recipientName, subject, htmlContent }) {
  const senderEmail = env.BREVO_SENDER_EMAIL || env.GMAIL_USER || "citisent.app@gmail.com";
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
      const err = new Error(data?.message || `Brevo API returned status ${response.status}`);
      err.provider = "brevo";
      err.statusCode = response.status;
      throw err;
    }

    return { success: true, messageId: data?.messageId, provider: "brevo" };
  } catch (err) {
    clearTimeout(timer);
    console.error("[EmailService Error] Brevo send failed:", err.message);
    throw err;
  }
}

/**
 * Dispatches an official invitation email to the newly provisioned Superadmin.
 * Prioritizes Brevo HTTPS API, falling back to Gmail SMTP or local simulation.
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

  // 1. Primary Provider: Brevo HTTPS REST API
  if (env.BREVO_API_KEY) {
    try {
      return await sendViaBrevo({ toEmail, recipientName, subject, htmlContent });
    } catch (brevoErr) {
      console.warn("[EmailService Notice] Brevo failed, checking fallback:", brevoErr.message);
      // Fallback to transporter if configured below
    }
  }

  // 2. Secondary Provider: Nodemailer (Gmail / SMTP)
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"CitiSent Platform" <${env.GMAIL_USER}>`,
        to: toEmail,
        subject,
        html: htmlContent,
      });
      return { success: true, provider: "smtp" };
    } catch (smtpErr) {
      console.error("[EmailService Error] Nodemailer send failed:", smtpErr.message);
      return { success: false, error: smtpErr.message };
    }
  }

  // 3. Fallback: Development Simulation
  console.warn(`[EmailService Notice] No Brevo or SMTP credentials set. Simulated email dispatch to ${toEmail}:`);
  console.log(`[EmailService Notice] Setup URL: ${setupUrl}`);
  return { success: true, simulated: true };
}
