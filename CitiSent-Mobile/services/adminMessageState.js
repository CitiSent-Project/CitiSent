/**
 * adminMessageState.js
 *
 * Singleton store for shared "has unread admin message" state.
 * Follows the exact same pattern as notificationState.js — a plain JS module
 * with a Set of listeners and a cached snapshot.
 *
 * Key design decisions:
 *   - Lives outside React, so navigation never destroys the state.
 *   - One Supabase Realtime channel for the entire app lifetime.
 *   - One Socket.IO listener for the entire app lifetime.
 *   - `unreadByReport`  → { [reportId]: boolean }  (per-card badge)
 *   - `hasUnreadAdminMessage` → boolean (Profile tab badge, page indicator)
 */

import { getSupabaseClient } from "./supabase";
import { getSocket } from "./socketService";
import { getAuthUser } from "./authSession";
import { discussionService } from "./discussionService";

// ─── Module-level state ────────────────────────────────────────────────────────

/** @type {Set<() => void>} */
const listeners = new Set();

/** @type {{ [reportId: string]: boolean }} */
let unreadByReport = {};

/** Whether the singleton has been initialized for the current session. */
let isInitialized = false;

/** The userId the singleton was initialized for. */
let initializedForUserId = null;

/** Supabase Realtime channel — kept alive for the app session. */
let supabaseChannel = null;

/** Whether the Socket.IO global listener has been attached. */
let socketListenerAttached = false;

// ─── Snapshot helpers ──────────────────────────────────────────────────────────

function computeHasUnread() {
  return Object.values(unreadByReport).some(Boolean);
}

function buildSnapshot() {
  return {
    unreadByReport: { ...unreadByReport },
    hasUnreadAdminMessage: computeHasUnread(),
  };
}

let cachedSnapshot = buildSnapshot();

function emitChange() {
  cachedSnapshot = buildSnapshot();
  listeners.forEach((l) => l());
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Subscribe to state changes. Returns an unsubscribe function.
 * Compatible with React's useSyncExternalStore.
 */
export function subscribeToAdminMessages(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Get the current snapshot. Compatible with React's useSyncExternalStore.
 */
export function getAdminMessagesSnapshot() {
  return cachedSnapshot;
}

/**
 * Mark a specific report's admin messages as read.
 * Clears that report's badge and re-evaluates the global flag.
 */
export function setReportRead(reportId) {
  if (!reportId) return;
  const key = String(reportId);
  if (unreadByReport[key] === false) return; // already clear — skip re-render

  const previousState = { ...cachedSnapshot };
  unreadByReport = { ...unreadByReport, [key]: false };
  emitChange();
  const newState = getAdminMessagesSnapshot();

  console.log("[Notification] Read state updated for report:", key);
  console.log("[Notification] Previous state:", previousState);
  console.log("[Notification] New state:", newState);
  console.log("[Notification] Manage Reports badge updated");
  console.log("[Notification] Profile badge updated");
  console.log("[Notification] Chat Admin badge updated");
}

/**
 * Mark a specific report as having an unread admin message.
 */
export function setReportUnread(reportId) {
  if (!reportId) return;
  const key = String(reportId);
  if (unreadByReport[key] === true) return; // already set — skip re-render

  const previousState = { ...cachedSnapshot };
  unreadByReport = { ...unreadByReport, [key]: true };
  emitChange();
  const newState = getAdminMessagesSnapshot();

  console.log("[Notification] Admin message detected");
  console.log("[Notification] Previous state:", previousState);
  console.log("[Notification] New state:", newState);
  console.log("[Notification] Manage Reports badge updated");
  console.log("[Notification] Profile badge updated");
  console.log("[Notification] Chat Admin badge updated");
}

/**
 * Seed the initial per-report unread state from a map of { reportId: boolean }.
 * Called by the Manage Reports screen after it fetches its report list.
 *
 * NOTE: Realtime events take precedence over stale false API/cache data.
 * If a report was marked true via Realtime event, seedUnreadState will NOT
 * overwrite it to false unless setReportRead was explicitly called.
 */
export function seedUnreadState(map) {
  if (!map || typeof map !== "object") return;
  let changed = false;
  const next = { ...unreadByReport };

  for (const [key, value] of Object.entries(map)) {
    const boolVal = Boolean(value);
    // If currently true from a realtime event, preserve it unless API confirms true
    if (next[key] === true && !boolVal) {
      continue;
    }
    if (next[key] !== boolVal) {
      next[key] = boolVal;
      changed = true;
    }
  }

  if (changed) {
    unreadByReport = next;
    emitChange();
  }
}

/**
 * Reset all state — called on logout so a new user starts clean.
 */
export function resetAdminMessageState() {
  unreadByReport = {};
  isInitialized = false;
  initializedForUserId = null;
  _teardownSubscriptions();
  emitChange();
}

// ─── Realtime subscription management ─────────────────────────────────────────

function _teardownSubscriptions() {
  if (supabaseChannel) {
    try {
      const client = getSupabaseClient();
      if (client) {
        client.removeChannel(supabaseChannel);
      }
    } catch {}
    supabaseChannel = null;
  }
  socketListenerAttached = false;
}

function _getEffectiveUserId(fallbackUserId = null) {
  return fallbackUserId || getAuthUser()?.id || initializedForUserId || null;
}

function _handleRealtimeInsert(payload, fallbackUserId) {
  console.log("[Realtime] INSERT received:", payload);
  console.log("[Realtime] New message:", payload?.new);

  const newMsg = payload?.new;
  if (!newMsg || !newMsg.report_id) return;

  const currentUserId = _getEffectiveUserId(fallbackUserId);
  const senderId = String(newMsg.sender_id ?? newMsg.senderId ?? "");

  // Ignore own messages
  if (currentUserId && senderId === String(currentUserId)) {
    return;
  }

  // Message from admin / external sender — update realtime notification badge
  setReportUnread(newMsg.report_id);
}

function _handleSocketMessage(data, fallbackUserId) {
  const reportId = data?.reportId;
  if (!reportId) return;

  const currentUserId = _getEffectiveUserId(fallbackUserId);
  const senderId = String(data?.message?.senderId ?? data?.message?.sender_id ?? "");
  if (currentUserId && senderId === String(currentUserId)) return;

  setReportUnread(reportId);
}

function _setupSupabaseChannel(userId) {
  if (supabaseChannel) return; // already subscribed

  try {
    const client = getSupabaseClient();
    if (!client) return;

    console.log("[Realtime] Creating subscription");
    supabaseChannel = client
      .channel("admin_msg_state_global")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "report_messages" },
        (payload) => _handleRealtimeInsert(payload, userId)
      )
      .subscribe((status) => {
        console.log("[Realtime] Subscription status:", status);
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          // Channel failed — clear the reference so the next call will re-subscribe
          supabaseChannel = null;
        }
      });
  } catch (err) {
    console.warn("[adminMessageState] Failed to subscribe to Supabase Realtime:", err?.message);
    supabaseChannel = null;
  }
}

function _setupSocketListener(userId) {
  if (socketListenerAttached) return;
  try {
    const socket = getSocket();
    if (!socket) return;

    socket.on("new_report_message", (data) => _handleSocketMessage(data, userId));
    socketListenerAttached = true;
  } catch (err) {
    console.warn("[adminMessageState] Failed to attach Socket.IO listener:", err?.message);
  }
}

/**
 * Initialize the singleton for the authenticated user.
 *
 * Safe to call multiple times — re-initializes if the user changed or subscriptions dropped.
 *
 * @param {string | null} userId - The authenticated user's ID
 * @param {string[]} [reportIds] - Optional: known report IDs to seed initial state
 */
export async function initializeAdminMessageState(userId, reportIds = []) {
  const targetUserId = userId ? String(userId) : getAuthUser()?.id ? String(getAuthUser().id) : null;

  if (isInitialized && initializedForUserId === targetUserId && supabaseChannel) {
    return; // already initialized & active for this user
  }

  if (targetUserId && initializedForUserId !== targetUserId) {
    _teardownSubscriptions();
  }

  isInitialized = true;
  initializedForUserId = targetUserId;

  // Set up realtime listeners
  _setupSupabaseChannel(targetUserId);
  _setupSocketListener(targetUserId);

  // Seed initial state if we have report IDs to check
  if (Array.isArray(reportIds) && reportIds.length > 0) {
    _seedFromApi(reportIds, targetUserId);
  }
}

/**
 * Fetch initial unread state for a list of report IDs.
 * Called once per session to populate the store on first load.
 * Also safe to call again when the report list changes (e.g. after loading more).
 *
 * @param {string[]} reportIds
 * @param {string | null} userId
 */
export async function seedUnreadStateFromApi(reportIds, userId = null) {
  if (!Array.isArray(reportIds) || reportIds.length === 0) return;

  const effectiveUserId = userId ?? getAuthUser()?.id ?? initializedForUserId ?? null;

  const results = await Promise.all(
    reportIds.map(async (reportId) => {
      try {
        const hasUnread = await discussionService.hasUnreadAdminMessage(reportId, effectiveUserId);
        return { id: String(reportId), hasUnread };
      } catch {
        return { id: String(reportId), hasUnread: false };
      }
    })
  );

  const map = {};
  for (const r of results) {
    map[r.id] = r.hasUnread;
  }
  seedUnreadState(map);
}

async function _seedFromApi(reportIds, userId) {
  try {
    await seedUnreadStateFromApi(reportIds, userId);
  } catch (err) {
    console.warn("[adminMessageState] Failed to seed initial unread state:", err?.message);
  }
}

