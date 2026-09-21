import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

function isJwtLike(value) {
  const parts = String(value || "").split(".");
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

function decodeJwtPayload(token) {
  try {
    const payload = String(token || "").split(".")[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padLength = (4 - (normalized.length % 4)) % 4;
    const padded = `${normalized}${"=".repeat(padLength)}`;
    const json = Buffer.from(padded, "base64").toString("utf8");

    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isValidSupabasePublicKey(value) {
  const key = String(value || "").trim();

  if (!key || key.startsWith("sb_secret_")) {
    return false;
  }

  if (key.startsWith("sb_publishable_")) {
    return true;
  }

  if (!isJwtLike(key)) {
    return false;
  }

  const payload = decodeJwtPayload(key);
  if (!payload || !payload.role) {
    return true;
  }

  return payload.role === "anon";
}

function isValidSupabaseAdminKey(value) {
  const key = String(value || "").trim();

  if (!key) {
    return false;
  }

  if (key.startsWith("sb_secret_")) {
    return true;
  }

  if (!isJwtLike(key)) {
    return false;
  }

  const payload = decodeJwtPayload(key);
  if (!payload || !payload.role) {
    return true;
  }

  return payload.role === "service_role";
}

const optionalString = (schema) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const normalized = value.trim();
    return normalized === "" ? undefined : normalized;
  }, schema.optional());

const envBoolean = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off", ""].includes(normalized)) {
    return false;
  }

  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default("/api/v1"),
  CORS_ORIGINS: z
    .string()
    .default(process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:8081"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z
    .string()
    .min(1)
    .refine(isValidSupabasePublicKey, {
      message:
        "SUPABASE_ANON_KEY must be a valid Supabase anon/public key (JWT anon key or sb_publishable_ key). Do not use sb_secret_ here.",
    }),
  SUPABASE_SERVICE_ROLE_KEY: optionalString(
    z.string().min(1).refine(isValidSupabaseAdminKey, {
      message:
        "SUPABASE_SERVICE_ROLE_KEY must be a valid service/admin key (service_role JWT or sb_secret_ key).",
    }),
  ),
  CACHE_DRIVER: z.enum(["auto", "memory", "redis"]).default("auto"),
  CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  CACHE_MAX_ITEMS: z.coerce.number().int().positive().default(2000),
  REDIS_URL: optionalString(
    z.string().refine(
      (val) => {
        try {
          const parsedUrl = new URL(val);
          return parsedUrl.protocol === "redis:" || parsedUrl.protocol === "rediss:";
        } catch {
          return false;
        }
      },
      { message: "REDIS_URL must be a valid redis:// or rediss:// URL" },
    ),
  ),
  RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  STARTUP_SUPABASE_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(8_000),
  SENTIMENT_API_URL: z
    .string()
    .url()
    .default("http://127.0.0.1:8000/analyze"),
  SENTIMENT_API_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
  SENTIMENT_API_KEY: optionalString(z.string().min(16)),
  GMAIL_USER: optionalString(z.string().email()),
  GMAIL_APP_PASSWORD: optionalString(z.string().min(1)),
  SMTP_HOST: optionalString(z.string()).default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().int().positive().default(465),
  SMTP_SECURE: envBoolean.default(true),
  RESEND_API_KEY: optionalString(z.string().min(1)),
  RESEND_FROM_EMAIL: optionalString(z.string()).default("CitiSent <onboarding@resend.dev>"),
  BREVO_API_KEY: optionalString(z.string().min(1)),
  INVITATION_JWT_SECRET: optionalString(z.string().min(32)),
  WEB_APP_BASE_URL: optionalString(z.string().url()),
  CLOUDFLARE_TURNSTILE_SECRET_KEY: optionalString(z.string().min(1)),
  ENABLE_RUNTIME_METRICS: envBoolean.default(false),
  RUNTIME_METRICS_INTERVAL_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(60_000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const message = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid environment configuration:\n${message}`);
}

const envData = parsed.data;

const normalizedOrigins = envData.CORS_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = Object.freeze({
  ...envData,
  isProduction: envData.NODE_ENV === "production",
  corsOrigins: normalizedOrigins,
});
