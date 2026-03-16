import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

const baseOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
};

export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  baseOptions,
);

export const supabaseAdmin = env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, baseOptions)
  : null;
