import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

const baseOptions = Object.freeze({
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  baseOptions,
);

export function createAdminSupabaseClient() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    ...baseOptions,
  });
}

export function createUserSupabaseClient(accessToken) {
  const token = String(accessToken || "").trim();

  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    ...baseOptions,
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}
