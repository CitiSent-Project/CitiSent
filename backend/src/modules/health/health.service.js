import { supabase } from "../../config/supabase.js";

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

    const { error } = await supabase
      .from("profiles")
      .select("user_id")
      .limit(1);

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
