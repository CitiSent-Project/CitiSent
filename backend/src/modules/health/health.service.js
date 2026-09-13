import { createAdminSupabaseClient, supabase } from "../../config/supabase.js";

function toCompactMessage(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeSupabaseError(error) {
  if (!error) {
    return null;
  }

  return {
    code: error.code || "UNKNOWN",
    message: toCompactMessage(error.message || "Unknown Supabase error"),
  };
}

export const healthService = {
  async getSupabaseReadiness() {
    const start = Date.now();
    const adminClient = createAdminSupabaseClient();

    // Use trusted server-side client when available.
    // If not configured, fall back to a public reference table (agencies)
    // rather than querying private user profiles anonymously.
    const queryPromise = adminClient
      ? adminClient.from("profiles").select("user_id").limit(1)
      : supabase.from("agencies").select("id").limit(1);

    const { error } = await queryPromise;

    const latencyMs = Date.now() - start;

    if (error) {
      return {
        connected: false,
        latencyMs,
        error: sanitizeSupabaseError(error),
      };
    }

    return {
      connected: true,
      latencyMs,
      error: null,
    };
  },
};
