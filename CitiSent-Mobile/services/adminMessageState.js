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
import { discussionService, appendMessageToCache } from "./discussionService";

// ─── Module-level state ────────────────────────────────────────────────────────

/** @type {Set<() => void>} */
const listeners = new Set();

/** @type {{ [reportId: string]: boolean }} */
let unreadByReport = {};

/** @type {{ [reportId: string]: string }} */
let statusByReport = {};

/**
 * Latest raw message row per report, populated from Supabase Realtime INSERTs.
 * Allows consumers to show a message preview without opening the modal.
 * @type {{ [reportId: string]: object }}
 */
let latestMessageByReport = {};

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
    statusByReport: { ...statusByReport },
    hasUnreadAdminMessage: computeHasUnread(),
    latestMessageByReport: { ...latestMessageByReport },
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
 * Register report statuses into the singleton store.
 * @param {Array<{ id: string | number, status: string }>} reports
 */
export function registerReportStatuses(reports) {
  if (!Array.isArray(reports) || reports.length === 0) return;
  let changed = false;
  const next = { ...statusByReport };

  for (const report of reports) {
    if (!report || !report.id) continue;
    const key = String(report.id);
    const status = report.status || "";
    if (next[key] !== status) {
      next[key] = status;
      changed = true;
    }
  }

  if (changed) {
    statusByReport = next;
    emitChange();
  }
}

/**
 * Seed the initial per-report unread state from a map of { reportId: boolean }.
 * Called by the Manage Reports screen after it fetches its report list.
 *
 * NOTE: Realtime events take precedence over stale false API/cache data.
 * If a report was marked true via Realtime event, seedUnreadState will NOT
 * overwrite it to false unless force is explicitly true (or setReportRead was called).
 */
export function seedUnreadState(map, force = false) {
  if (!map || typeof map !== "object") return;
  let changed = false;
  const next = { ...unreadByReport };

  for (const [key, value] of Object.entries(map)) {
    const boolVal = Boolean(value);
    // Protect against race condition:
    // If a realtime event already set unreadByReport[key] to true, do not overwrite
    // with stale false from initial API loading unless force is true (e.g. on modal close).
    if (!force && next[key] === true && boolVal === false) {
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
  statusByReport = {};
  latestMessageByReport = {};
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
  const newMsg = payload?.new;
  if (!newMsg || !newMsg.report_id) return;

  const currentUserId = _getEffectiveUserId(fallbackUserId);
  const senderId = String(newMsg.sender_id ?? newMsg.senderId ?? "");

  // Ignore own messages
  if (currentUserId && senderId === String(currentUserId)) return;

  const reportId = String(newMsg.report_id);
  let changed = false;

  // Mark report as unread (badge)
  if (unreadByReport[reportId] !== true) {
    unreadByReport = { ...unreadByReport, [reportId]: true };
    changed = true;
  }

  // Store latest message so consumers can read it without opening the modal
  latestMessageByReport = { ...latestMessageByReport, [reportId]: newMsg };
  changed = true;

  // If the report status is not yet registered, attempt to fetch it in background
  // to ensure filter-specific badges light up accurately.
  if (!statusByReport[reportId]) {
    import("./api")
      .then(({ api }) => api.get(`/reports/${reportId}`))
      .then((res) => {
        const reportData = res?.data || res;
        if (reportData?.status) {
          statusByReport = { ...statusByReport, [reportId]: reportData.status };
          emitChange();
        }
      })
      .catch(() => {});
  }

  if (changed) emitChange();

  // Patch the discussion cache so the next modal open shows the new message
  // immediately instead of serving a stale cache entry.
  appendMessageToCache(reportId, newMsg).catch(() => {});
}

function _handleSocketMessage(data, fallbackUserId) {
  const reportId = data?.reportId;
  if (!reportId) return;

  const currentUserId = _getEffectiveUserId(fallbackUserId);
  const senderId = String(data?.message?.senderId ?? data?.message?.sender_id ?? "");
  if (currentUserId && senderId === String(currentUserId)) return;

  const key = String(reportId);
  let changed = false;

  if (unreadByReport[key] !== true) {
    unreadByReport = { ...unreadByReport, [key]: true };
    changed = true;
  }

  // Store latest message from socket payload
  if (data?.message) {
    latestMessageByReport = { ...latestMessageByReport, [key]: data.message };
    changed = true;
    // Patch discussion cache via socket payload message shape
    appendMessageToCache(key, data.message).catch(() => {});
  }

  if (!statusByReport[key]) {
    import("./api")
      .then(({ api }) => api.get(`/reports/${key}`))
      .then((res) => {
        const reportData = res?.data || res;
        if (reportData?.status) {
          statusByReport = { ...statusByReport, [key]: reportData.status };
          emitChange();
        }
      })
      .catch(() => {});
  }

  if (changed) emitChange();
}

function _setupSupabaseChannel(userId) {
  if (supabaseChannel) return; // already subscribed

  try {
    const client = getSupabaseClient();
    if (!client) return;

    supabaseChannel = client
      .channel("admin_msg_state_global")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "report_messages" },
        (payload) => _handleRealtimeInsert(payload, userId)
      )
      .subscribe((status) => {
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
 * @param {boolean} force
 */
export async function seedUnreadStateFromApi(reportIds, userId = null, force = false) {
  if (!Array.isArray(reportIds) || reportIds.length === 0) return;

  const effectiveUserId = userId ?? getAuthUser()?.id ?? initializedForUserId ?? null;

  // Filter only report IDs that have not yet been evaluated, unless forced (e.g. on modal close)
  const targetIds = force
    ? reportIds
    : reportIds.filter((id) => unreadByReport[String(id)] === undefined);

  if (targetIds.length === 0) return;

  const results = await Promise.all(
    targetIds.map(async (reportId) => {
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
  seedUnreadState(map, force);
}


async function _seedFromApi(reportIds, userId) {
  try {
    await seedUnreadStateFromApi(reportIds, userId);
  } catch (err) {
    console.warn("[adminMessageState] Failed to seed initial unread state:", err?.message);
  }
}

