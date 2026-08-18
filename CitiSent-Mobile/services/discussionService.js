import { api } from "./api";
import { getAuthToken, getAuthUser } from "./authSession";
import { getCache, setCache } from "./cache";

const CACHE_KEY_PREFIX = "report_discussion_";
const LAST_SEEN_KEY_PREFIX = "report_last_seen_";
const CACHE_TTL = 60 * 5; // 5 minutes

/**
 * In-flight request deduplication map.
 *
 * Prevents duplicate API calls for the same reportId when getDiscussion is
 * called concurrently — e.g. loadMessages + getUnreadCount both firing in the
 * same modal useEffect. Both calls await the same Promise instead of spawning
 * two separate HTTP requests.
 *
 * Fix for Issue #10 (no request deduplication).
 */
const _inflight = new Map();

/**
 * Returns the current authenticated user's ID, or "anon" as a safe fallback.
 * Used to namespace all cache keys so data from one user is never served to
 * another on a shared device.
 *
 * Fix for Issue #3 (no per-user cache isolation).
 */
function getUid() {
  return getAuthUser()?.id ?? "anon";
}

/**
 * Per-user, per-report cache key for the message thread.
 * Format: report_discussion_{userId}_{reportId}
 */
function cacheKey(reportId) {
  return `${CACHE_KEY_PREFIX}${getUid()}_${reportId}`;
}

/**
 * Per-user, per-report cache key for the "last seen" timestamp.
 * Format: report_last_seen_{userId}_{reportId}
 */
function lastSeenKey(reportId) {
  return `${LAST_SEEN_KEY_PREFIX}${getUid()}_${reportId}`;
}

/**
 * Map a backend message row to a cacheable shape.
 * We store senderId so that senderRole can be computed at read-time
 * with the correct currentUserId, avoiding stale role misclassification
 * when auth hasn't loaded yet.
 */
export function mapApiMessage(msg) {
  return {
    id: msg.id,
    senderId: String(msg.senderId ?? msg.sender_id ?? ""),
    senderName: msg.sender_name || msg.senderName || "City Admin",
    message: msg.message || msg.content || "",
    attachmentUri: null,
    createdAt: msg.createdAt || msg.created_at || new Date().toISOString(),
    isRead: msg.isRead ?? false,
  };
}

/**
 * Classify cached messages using the current userId at read-time.
 * This avoids stale senderRole values in the cache.
 */
export function classifyMessages(messages, currentUserId) {
  return messages.map((m) => {
    const isCurrentUser = currentUserId && m.senderId && String(m.senderId) === String(currentUserId);
    return {
      ...m,
      senderRole: isCurrentUser ? "citizen" : "admin",
      senderName: isCurrentUser ? "You" : (m.senderName || "City Admin"),
    };
  });
}

/**
 * Convert a raw message object or socket payload row to a classified UI message.
 */
export function mapRawRow(row, currentUserId) {
  const mapped = mapApiMessage(row);
  return classifyMessages([mapped], currentUserId)[0];
}

/**
 * Append a single raw message row (from a Supabase Realtime INSERT) to the
 * cached discussion thread for a report.
 *
 * Called by adminMessageState when a new message arrives while the chat modal
 * is closed, so the next `getDiscussion` call immediately returns the correct
 * latest message instead of serving a stale cache entry.
 *
 * Safe to call concurrently — idempotent on duplicate message IDs.
 *
 * @param {string} reportId
 * @param {object} rawMessage - The `payload.new` object from Supabase Realtime
 */
export async function appendMessageToCache(reportId, rawMessage) {
  if (!reportId || !rawMessage) return;
  try {
    const key = cacheKey(reportId);
    const cached = await getCache(key, { ignoreExpiry: true });
    const existing = Array.isArray(cached) ? cached : [];
    const mapped = mapApiMessage(rawMessage);
    // Idempotent — skip if already present
    if (existing.some((m) => String(m.id) === String(mapped.id))) return;
    await setCache(key, [...existing, mapped], CACHE_TTL);
  } catch {
    // Non-critical — cache miss will be recovered on next API fetch
  }
}

function isAuthAvailable() {
  const token = getAuthToken();
  return Boolean(token) && !token.startsWith("temp-");
}

/**
 * Shared fetch logic used by both the cache-miss path and the background
 * revalidation path. Deduplicates concurrent requests via the _inflight map.
 *
 * Returns a Promise<rawMessages[]> and registers itself in _inflight so
 * concurrent callers can await the same in-flight request.
 */
function ensureDiscussionFetched(reportId) {
  if (!_inflight.has(reportId)) {
    const fetchPromise = (async () => {
      const response = await api.get(`/reports/${reportId}/messages`);
      const rows = Array.isArray(response?.data) ? response.data : [];
      const rawMessages = rows.map(mapApiMessage);
      // Fire-and-forget cache write — don't block the return value
      setCache(cacheKey(reportId), rawMessages, CACHE_TTL).catch(() => {});
      return rawMessages;
    })();

    _inflight.set(reportId, fetchPromise);
    // Always clean up the in-flight entry when settled (success or failure)
    fetchPromise.finally(() => _inflight.delete(reportId));
  }

  return _inflight.get(reportId);
}

export const discussionService = {
  /**
   * Fetch the full conversation for a report.
   *
   * Strategy (Fix for Issue #2 — cache-first):
   *   1. Fresh cache hit → return immediately, kick off background revalidation
   *   2. Cache miss → fetch from API (deduplicated via _inflight map)
   *   3. API failure → fall back to stale cache (offline support)
   *   4. No cache at all → return ephemeral seed message
   *
   * This replaces the old "always hit the API first" approach that ignored the
   * cache entirely and caused excessive Supabase requests and 429 errors.
   */
  getDiscussion: async (reportId, currentUserId = null) => {
    // Step 1: Fresh cache hit — serve instantly, revalidate in background
    const cached = await getCache(cacheKey(reportId));
    if (Array.isArray(cached) && cached.length > 0) {
      if (isAuthAvailable()) {
        // Stale-while-revalidate: refresh cache in background without blocking UI
        ensureDiscussionFetched(reportId).catch(() => {});
      }
      return classifyMessages(cached, currentUserId);
    }

    // Step 2: Cache miss — fetch from API with in-flight deduplication
    if (isAuthAvailable()) {
      try {
        const rawMessages = await ensureDiscussionFetched(reportId);
        return classifyMessages(rawMessages, currentUserId);
      } catch (err) {
        console.warn("Failed to fetch report messages from API, using cache:", err?.message);
      }
    }

    // Step 3: Stale cache fallback (offline or auth unavailable)
    const stale = await getCache(cacheKey(reportId), { ignoreExpiry: true });
    if (Array.isArray(stale) && stale.length > 0) {
      return classifyMessages(stale, currentUserId);
    }

    // Step 4: Absolute fallback — ephemeral seed message.
    // isRead: true so it is never counted as unread (Fix for Issue #9).
    const seed = [
      {
        id: `msg-init-${reportId}`,
        senderId: "",
        senderName: "City Admin",
        message: "Thank you for submitting your report. Our team is currently reviewing your submission.",
        attachmentUri: null,
        createdAt: new Date(0).toISOString(),
        isRead: true,
      },
    ];
    await setCache(cacheKey(reportId), seed, CACHE_TTL);
    return classifyMessages(seed, currentUserId);
  },

  /**
   * Send a new message to the backend and return the updated thread.
   * Falls back to optimistic local-only update if API is unavailable.
   */
  sendMessage: async (reportId, text, attachmentUri = null, onAdminReply = null, currentUserId = null) => {
    const trimmedText = String(text || "").trim();
    if (!trimmedText && !attachmentUri) return [];

    const cached = await getCache(cacheKey(reportId), { ignoreExpiry: true }) || [];
    // Optimistic local message — uses senderId for cache shape consistency
    const localMessage = {
      id: `msg-local-${Date.now()}`,
      senderId: String(currentUserId ?? ""),
      senderName: "You",
      message: trimmedText,
      attachmentUri: attachmentUri || null,
      createdAt: new Date().toISOString(),
      isRead: false,
      pending: true,
    };

    const optimisticThread = [...cached, localMessage];
    await setCache(cacheKey(reportId), optimisticThread, CACHE_TTL);

    if (isAuthAvailable()) {
      try {
        await api.post(`/reports/${reportId}/messages`, { message: trimmedText });

        // Re-fetch the authoritative list from the server
        const fresh = await discussionService.getDiscussion(reportId, currentUserId);

        if (onAdminReply) {
          // Poll for a real admin reply after 3 seconds (handles reply notification gap).
          // The caller is responsible for guarding against unmounted component updates
          // via an isMountedRef (see ReportDiscussionModal).
          setTimeout(async () => {
            const refreshed = await discussionService.getDiscussion(reportId, currentUserId);
            onAdminReply(refreshed);
          }, 3000);
        }

        return fresh;
      } catch (err) {
        console.warn("Failed to send message to API:", err?.message);
      }
    }

    return optimisticThread;
  },

  /**
   * Check if at least one admin message is currently unread for the current user.
   * Short-circuits as a boolean state (hasUnreadAdminMessage = true / false).
   *
   * Always awaits fresh data from the API (via ensureDiscussionFetched) rather
   * than the cache-first getDiscussion path, because the stale-while-revalidate
   * cache can miss new admin messages that arrived while the component was
   * unmounted. Falls back to cache-first if the API call fails.
   */
  hasUnreadAdminMessage: async (reportId, currentUserId = null) => {
    if (!reportId) return false;
    try {
      let messages;
      if (isAuthAvailable()) {
        try {
          const rawMessages = await ensureDiscussionFetched(reportId);
          messages = classifyMessages(rawMessages, currentUserId);
        } catch {
          // API failed — fall back to cache-first approach
          messages = await discussionService.getDiscussion(reportId, currentUserId);
        }
      } else {
        messages = await discussionService.getDiscussion(reportId, currentUserId);
      }

      const lastSeenTs = await getCache(lastSeenKey(reportId), { ignoreExpiry: true });
      const lastSeenTime = lastSeenTs ? new Date(lastSeenTs).getTime() : 0;

      return messages.some((m) => {
        if (m.senderRole === "citizen") return false; // own messages never count
        if (m.id && String(m.id).startsWith("msg-init-")) return false; // ignore seed

        const msgTime = new Date(m.createdAt).getTime();
        if (lastSeenTime > 0 && msgTime <= lastSeenTime) return false;

        return m.isRead === false;
      });
    } catch {
      return false;
    }
  },

  /**
   * Legacy wrapper for backwards compatibility. Returns 1 if unread admin message exists, 0 otherwise.
   */
  getUnreadCount: async (reportId, currentUserId = null) => {
    const hasUnread = await discussionService.hasUnreadAdminMessage(reportId, currentUserId);
    return hasUnread ? 1 : 0;
  },

  /**
   * Record the moment the user opened a conversation so future unread
   * counts only include messages that arrived AFTER this timestamp.
   * Also tells the backend to mark the conversation as read.
   *
   * Cache strategy: patch cached messages in-place (isRead: true) rather than
   * deleting the cache. Keeps the cache warm so getUnreadCount returns 0
   * immediately without a forced API re-fetch that would trigger 429 errors.
   */
  markAsRead: async (reportId) => {
    if (!reportId) return;

    // Save timestamp locally — used as a secondary guard for offline messages
    await setCache(lastSeenKey(reportId), new Date().toISOString(), 86400 * 365);

    // Patch cached messages: mark all as isRead so getUnreadCount returns 0
    // immediately from cache without any network request.
    const cached = await getCache(cacheKey(reportId), { ignoreExpiry: true });
    if (Array.isArray(cached) && cached.length > 0) {
      const patched = cached.map((msg) => ({ ...msg, isRead: true }));
      await setCache(cacheKey(reportId), patched, CACHE_TTL);
    }

    // Best-effort server sync
    if (isAuthAvailable()) {
      try {
        await api.patch(`/reports/${reportId}/messages/read`, {});
      } catch {
        // Non-critical — silently ignore
      }
    }
  },
};
