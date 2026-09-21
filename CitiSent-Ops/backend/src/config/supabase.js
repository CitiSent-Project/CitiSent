import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

const baseOptions = Object.freeze({
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Administrative Supabase Client with full service_role privileges.
 * Strictly used within the server layer for provisioning and seeding.
 */
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  baseOptions
);

/**
 * Anonymous Supabase Client used to verify developer JWT bearer tokens.
 */
export const supabaseAuthVerifier = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  baseOptions
);
