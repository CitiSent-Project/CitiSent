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
function mapApiMessage(msg) {
  return {
    id: msg.id,
    senderId: String(msg.senderId ?? ""),
    senderName: msg.sender_name || "City Admin",
    message: msg.message || "",
    attachmentUri: null,
    createdAt: msg.createdAt || new Date().toISOString(),
    isRead: msg.isRead ?? false,
  };
}

/**
 * Classify cached messages using the current userId at read-time.
 * This avoids stale senderRole values in the cache.
 */
function classifyMessages(messages, currentUserId) {
  return messages.map((m) => {
    const isCurrentUser = currentUserId && m.senderId && String(m.senderId) === String(currentUserId);
    return {
      ...m,
      senderRole: isCurrentUser ? "citizen" : "admin",
      senderName: isCurrentUser ? "You" : (m.senderName || "City Admin"),
    };
  });
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
   * Count how many admin messages are currently unread for the current user.
   *
   * Primary truth: server `isRead` field (resolved from the report_message_reads
   * join table by the backend mapper). A message is unread when isRead === false.
   *
   * Secondary guard (lastSeenTime): used only for locally-generated or offline
   * messages that predate the DB (e.g. the epoch-timestamp seed message). This
   * prevents seed messages from ever counting as unread.
   */
  getUnreadCount: async (reportId, currentUserId = null) => {
    if (!reportId) return 0;
    try {
      const [messages, lastSeenTs] = await Promise.all([
        discussionService.getDiscussion(reportId, currentUserId),
        getCache(lastSeenKey(reportId), { ignoreExpiry: true }),
      ]);

      // lastSeenTime is used only to guard against offline/seed messages.
      // Server-authored messages use isRead as the authoritative signal.
      const lastSeenTime = lastSeenTs ? new Date(lastSeenTs).getTime() : 0;

      return messages.filter((m) => {
        if (m.senderRole === "citizen") return false; // own messages never count
        if (m.id && String(m.id).startsWith("msg-init-")) return false; // ignore seed

        const msgTime = new Date(m.createdAt).getTime();

        // For messages created before the user ever opened the chat (epoch guard),
        // use the timestamp fallback so pre-existing content isn't suddenly flagged.
        if (lastSeenTime > 0 && msgTime <= lastSeenTime) return false;

        // Primary truth: use server-confirmed isRead.
        return m.isRead === false;
      }).length;
    } catch {
      return 0;
    }
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
