import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

const baseOptions = Object.freeze({
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// ─── Shared (anon) client ────────────────────────────────────────────
// Created once at module load; safe to reuse across all requests.
export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  baseOptions,
);

// ─── Admin client (singleton) ────────────────────────────────────────
// Uses the service-role key. Created lazily on first call and reused
// for every subsequent call, preventing a new instance per request.
let _adminClient = null;

export function createAdminSupabaseClient() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  if (!_adminClient) {
    _adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      ...baseOptions,
    });
  }

  return _adminClient;
}

// ─── Per-user client (token-based cache) ─────────────────────────────
// Each unique access-token gets its own client, but we reuse the same
// instance for repeated calls with the same token (e.g. multiple DB
// queries within a single request lifecycle).  A size cap prevents
// unbounded memory growth over long uptimes.
const USER_CLIENT_CACHE_MAX = 500;
const _userClients = new Map();

export function createUserSupabaseClient(accessToken) {
  const token = String(accessToken || "").trim();

  // Return a cached client if one already exists for this token.
  if (_userClients.has(token)) {
    return _userClients.get(token);
  }

  // Safety valve: clear the entire cache if it grows too large.
  // This is a simple eviction strategy that keeps memory bounded.
  if (_userClients.size >= USER_CLIENT_CACHE_MAX) {
    _userClients.clear();
  }

  const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    ...baseOptions,
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  _userClients.set(token, client);
  return client;
}
