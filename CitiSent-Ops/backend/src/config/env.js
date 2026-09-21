import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5001),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CORS_ORIGINS: z.string().default("http://localhost:5174"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DEVELOPER_ALLOWED_EMAILS: z.string().default(""),
  CLIENT_WEB_APP_BASE_URL: z.string().url().default("http://localhost:5173"),
  BREVO_API_KEY: z.string().optional().default(""),
  BREVO_SENDER_EMAIL: z.string().optional().default("citisent.app@gmail.com"),
  BREVO_SENDER_NAME: z.string().optional().default("CitiSent Platform"),
  GMAIL_USER: z.string().optional().default(""),
  GMAIL_APP_PASSWORD: z.string().optional().default(""),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`[CitiSent-Ops Backend] Invalid environment configuration:\n${issues}`);
}

const envData = parsed.data;

const normalizedOrigins = envData.CORS_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const normalizedDeveloperEmails = envData.DEVELOPER_ALLOWED_EMAILS.split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const env = Object.freeze({
  ...envData,
  isProduction: envData.NODE_ENV === "production",
  corsOrigins: normalizedOrigins,
  developerAllowedEmails: normalizedDeveloperEmails,
});
