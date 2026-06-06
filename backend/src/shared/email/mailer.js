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

export function buildResetPasswordUrl(token) {
  requireMailConfig();
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

export async function sendAccountInvitationEmail({ toEmail, recipientName, setupUrl }) {
  const safeName = escapeHtml(recipientName || "CitiSent user");

  await getTransporter().sendMail({
    from: `"CitiSent" <${env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Set up your CitiSent account",
    text: [
      `Hello ${recipientName || "there"},`,
      "",
      "An administrator created a CitiSent account for you. Welcome to the platform!",
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
              An administrator has created a new CitiSent account for you. Welcome to the platform!
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
