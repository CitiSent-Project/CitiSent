import { createClient } from "@supabase/supabase-js";

let supabaseClient = null;

function getSupabaseEnv() {
  return {
    url: String(process.env.EXPO_PUBLIC_SUPABASE_URL || "").trim(),
    key: String(process.env.EXPO_PUBLIC_SUPABASE_KEY || "").trim(),
  };
}

function isHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isSupabaseConfigured() {
  const { url, key } = getSupabaseEnv();
  return Boolean(key) && isHttpUrl(url);
}

export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const { url, key } = getSupabaseEnv();

  if (!isHttpUrl(url)) {
    throw new Error(
      "Invalid EXPO_PUBLIC_SUPABASE_URL. Please set a valid Supabase URL in .env.local.",
    );
  }

  if (!key) {
    throw new Error(
      "Missing EXPO_PUBLIC_SUPABASE_KEY. Please set your Supabase key in .env.local.",
    );
  }

  supabaseClient = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });

  return supabaseClient;
}

export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      return getSupabaseClient()[prop];
    },
  },
);
