import { api } from "./api";
import { getAuthToken } from "./authSession";
import { getCache, setCache } from "./cache";

const CACHE_KEY_PREFIX = "report_discussion_";
const LAST_SEEN_KEY_PREFIX = "report_last_seen_";
const CACHE_TTL = 60 * 5; // 5 minutes

function cacheKey(reportId) {
  return `${CACHE_KEY_PREFIX}${reportId}`;
}

function lastSeenKey(reportId) {
  return `${LAST_SEEN_KEY_PREFIX}${reportId}`;
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

export const discussionService = {
  /**
   * Fetch the full conversation for a report from the backend.
   * Stores raw senderId in cache, then classifies messages at read-time
   * using the current user's ID to avoid stale senderRole mismatches.
   */
  getDiscussion: async (reportId, currentUserId = null) => {
    if (isAuthAvailable()) {
      try {
        const response = await api.get(`/reports/${reportId}/messages`);
        const rows = Array.isArray(response?.data) ? response.data : [];
        // Store raw shape (with senderId) — no senderRole baked in
        const rawMessages = rows.map((msg) => mapApiMessage(msg));
        await setCache(cacheKey(reportId), rawMessages, CACHE_TTL);
        return classifyMessages(rawMessages, currentUserId);
      } catch (err) {
        console.warn("Failed to fetch report messages from API, using cache:", err?.message);
      }
    }

    // Fallback: local cache — classify at read-time with fresh userId
    const cached = await getCache(cacheKey(reportId), { ignoreExpiry: true });
    if (Array.isArray(cached) && cached.length > 0) {
      return classifyMessages(cached, currentUserId);
    }

    // Absolute fallback: seed message — epoch timestamp means it never counts as unread
    const seed = [
      {
        id: `msg-init-${reportId}`,
        senderId: "",
        senderName: "City Admin",
        message: "Thank you for submitting your report. Our team is currently reviewing your submission.",
        attachmentUri: null,
        createdAt: new Date(0).toISOString(),
        isRead: false,
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
          // Poll for a real admin reply after 3 seconds (handles reply notification gap)
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
   *
   * This replaces the old "count by timestamp" approach that ignored isRead entirely
   * and caused every message to re-appear as unread after a cache clear or restart.
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
        // isRead is false by default on cached/local messages, so this catches
        // both new server messages and any locally-cached unread ones.
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
   * IMPORTANT: Instead of removing the cache (which forces a new API fetch and
   * causes 429 rate-limit errors when many reports are loaded), we patch the
   * cached messages in-place by marking all of them as isRead: true. This keeps
   * the cache warm so getUnreadCount can compute a 0 count without any API call.
   */
  markAsRead: async (reportId) => {
    if (!reportId) return;

    // Save timestamp locally — used as a secondary guard for offline messages
    await setCache(lastSeenKey(reportId), new Date().toISOString(), 86400 * 365);

    // Patch cached messages: mark all as isRead so getUnreadCount returns 0
    // immediately from cache. This avoids a forced API re-fetch that would
    // hammer Supabase and trigger 429 rate-limiting errors.
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
