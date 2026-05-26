import nodemailer from "nodemailer";
import { StatusCodes } from "http-status-codes";
import { env } from "../../config/env.js";
import { AppError } from "../errors/appError.js";

let cachedTransporter = null;

function requireMailConfig() {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD || !env.WEB_APP_BASE_URL) {
    throw new AppError(
      "Account invitation email is not configured. Set GMAIL_USER, GMAIL_APP_PASSWORD, and WEB_APP_BASE_URL.",
      StatusCodes.SERVICE_UNAVAILABLE,
    );
  }
}

function getTransporter() {
  requireMailConfig();

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.GMAIL_USER,
        pass: env.GMAIL_APP_PASSWORD,
      },
    });
  }

  return cachedTransporter;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildSetupPasswordUrl(token) {
  requireMailConfig();
  const url = new URL("/setup-password", env.WEB_APP_BASE_URL);
  url.searchParams.set("token", token);
  return url.toString();
}

export async function sendAccountInvitationEmail({ toEmail, recipientName, setupUrl }) {
  const safeName = escapeHtml(recipientName || "CitiSent user");

  await getTransporter().sendMail({
    from: `"CitiSent" <${env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Set up your CitiSent account",
    text: [
      `Hello ${recipientName || "there"},`,
      "",
      "An administrator created a CitiSent account for you.",
      "Use this secure link within 24 hours to choose your password:",
      setupUrl,
      "",
      "If you did not expect this invitation, you can ignore this email.",
    ].join("\n"),
    html: `
      <p>Hello ${safeName},</p>
      <p>An administrator created a CitiSent account for you.</p>
      <p>
        <a href="${escapeHtml(setupUrl)}">Set up your password</a>
      </p>
      <p>This secure link expires in 24 hours.</p>
      <p>If you did not expect this invitation, you can ignore this email.</p>
    `,
  });
}
