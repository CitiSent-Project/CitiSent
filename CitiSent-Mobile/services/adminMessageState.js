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
  unreadByReport = { ...unreadByReport, [key]: false };
  emitChange();
}

/**
 * Mark a specific report as having an unread admin message.
 */
export function setReportUnread(reportId) {
  if (!reportId) return;
  const key = String(reportId);
  if (unreadByReport[key] === true) return; // already set — skip re-render
  unreadByReport = { ...unreadByReport, [key]: true };
  emitChange();
}

/**
 * Seed the initial per-report unread state from a map of { reportId: boolean }.
 * Called by the Manage Reports screen after it fetches its report list.
 */
export function seedUnreadState(map) {
  if (!map || typeof map !== "object") return;
  let changed = false;
  const next = { ...unreadByReport };
  for (const [key, value] of Object.entries(map)) {
    const boolVal = Boolean(value);
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
      client.removeChannel(supabaseChannel);
    } catch {}
    supabaseChannel = null;
  }
  // Socket.IO: we don't remove the listener here because the socket is a
  // singleton too. We just gate on isInitialized in the handler itself.
  socketListenerAttached = false;
}

function _handleRealtimeInsert(payload, currentUserId) {
  if (!isInitialized) return;
  const newMsg = payload?.new;
  if (!newMsg || !newMsg.report_id) return;

  const senderId = String(newMsg.sender_id ?? newMsg.senderId ?? "");
  // Ignore own messages
  if (currentUserId && senderId === String(currentUserId)) return;

  // It's a message from someone else (admin) — mark that report unread
  setReportUnread(newMsg.report_id);
}

function _handleSocketMessage(data, currentUserId) {
  if (!isInitialized) return;
  const reportId = data?.reportId;
  if (!reportId) return;

  const senderId = String(data?.message?.senderId ?? data?.message?.sender_id ?? "");
  if (currentUserId && senderId === String(currentUserId)) return;

  setReportUnread(reportId);
}

function _setupSupabaseChannel(currentUserId) {
  if (supabaseChannel) return; // already subscribed

  try {
    const client = getSupabaseClient();
    if (!client) return;

    supabaseChannel = client
      .channel("admin_msg_state_global")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "report_messages" },
        (payload) => _handleRealtimeInsert(payload, currentUserId)
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          // Channel failed — clear the reference so the next initialize() call
          // will re-subscribe.
          supabaseChannel = null;
        }
      });
  } catch (err) {
    console.warn("[adminMessageState] Failed to subscribe to Supabase Realtime:", err?.message);
  }
}

function _setupSocketListener(currentUserId) {
  if (socketListenerAttached) return;
  try {
    const socket = getSocket();
    if (!socket) return;

    socket.on("new_report_message", (data) => _handleSocketMessage(data, currentUserId));
    socketListenerAttached = true;
  } catch (err) {
    console.warn("[adminMessageState] Failed to attach Socket.IO listener:", err?.message);
  }
}

/**
 * Initialize the singleton for the authenticated user.
 *
 * Should be called once after auth session is ready (in the root _layout.jsx).
 * Safe to call multiple times — re-initializes only if the user changed.
 *
 * @param {string | null} userId - The authenticated user's ID
 * @param {string[]} [reportIds] - Optional: known report IDs to seed initial state
 */
export async function initializeAdminMessageState(userId, reportIds = []) {
  if (isInitialized && initializedForUserId === String(userId)) {
    return; // already initialized for this user
  }

  // Tear down any existing subscriptions from a previous session
  _teardownSubscriptions();

  isInitialized = true;
  initializedForUserId = String(userId);

  // Set up realtime listeners
  _setupSupabaseChannel(userId);
  _setupSocketListener(userId);

  // Seed initial state if we have report IDs to check
  if (Array.isArray(reportIds) && reportIds.length > 0) {
    _seedFromApi(reportIds, userId);
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

  const effectiveUserId = userId ?? getAuthUser()?.id ?? null;

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
