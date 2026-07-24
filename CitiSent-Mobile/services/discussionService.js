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
 * Map a backend message row to a UI-friendly shape.
 * The backend response from the mapper includes:
 *   id, reportId, senderId, sender_name, message, isRead, readAt, createdAt, updatedAt
 */
function mapApiMessage(msg, currentUserId) {
  const isCurrentUser = currentUserId && String(msg.senderId) === String(currentUserId);
  return {
    id: msg.id,
    senderRole: isCurrentUser ? "citizen" : "admin",
    senderName: isCurrentUser ? "You" : (msg.sender_name || "City Admin"),
    message: msg.message || "",
    attachmentUri: null,
    createdAt: msg.createdAt || new Date().toISOString(),
    isRead: msg.isRead ?? false,
  };
}

function isAuthAvailable() {
  const token = getAuthToken();
  return Boolean(token) && !token.startsWith("temp-");
}

export const discussionService = {
  /**
   * Fetch the full conversation for a report from the backend.
   * Falls back to local cache if the network or auth is unavailable.
   */
  getDiscussion: async (reportId, currentUserId = null) => {
    if (isAuthAvailable()) {
      try {
        const response = await api.get(`/reports/${reportId}/messages`);
        const rows = Array.isArray(response?.data) ? response.data : [];
        const messages = rows.map((msg) => mapApiMessage(msg, currentUserId));

        // Update local cache with the latest data
        await setCache(cacheKey(reportId), messages, CACHE_TTL);
        return messages;
      } catch (err) {
        console.warn("Failed to fetch report messages from API, using cache:", err?.message);
      }
    }

    // Fallback: local cache
    const cached = await getCache(cacheKey(reportId), { ignoreExpiry: true });
    if (Array.isArray(cached) && cached.length > 0) {
      return cached;
    }

    // Absolute fallback: seed message (mark as already seen so it doesn't trigger badge)
    const seed = [
      {
        id: `msg-init-${reportId}`,
        senderRole: "admin",
        senderName: "City Admin",
        message: "Thank you for submitting your report. Our team is currently reviewing your submission.",
        attachmentUri: null,
        createdAt: new Date(0).toISOString(), // epoch — always "old"
        isRead: false,
      },
    ];
    await setCache(cacheKey(reportId), seed, CACHE_TTL);
    return seed;
  },

  /**
   * Send a new message to the backend and return the updated thread.
   * Falls back to optimistic local-only update if API is unavailable.
   */
  sendMessage: async (reportId, text, attachmentUri = null, onAdminReply = null, currentUserId = null) => {
    const trimmedText = String(text || "").trim();
    if (!trimmedText && !attachmentUri) return [];

    const cached = await getCache(cacheKey(reportId), { ignoreExpiry: true }) || [];

    // Optimistic local message
    const localMessage = {
      id: `msg-local-${Date.now()}`,
      senderRole: "citizen",
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
   * Count how many admin messages arrived AFTER the last time the user
   * opened this conversation. Uses a locally stored "last seen" timestamp
   * so even offline/local messages are tracked correctly.
   */
  getUnreadCount: async (reportId, currentUserId = null) => {
    if (!reportId) return 0;
    try {
      const [messages, lastSeenTs] = await Promise.all([
        discussionService.getDiscussion(reportId, currentUserId),
        getCache(lastSeenKey(reportId), { ignoreExpiry: true }),
      ]);

      // If the user has never opened the chat, treat all messages as read
      // (avoids badge spam on first load for old reports)
      if (!lastSeenTs) return 0;

      const lastSeenTime = new Date(lastSeenTs).getTime();

      return messages.filter((m) => {
        if (m.senderRole === "citizen") return false; // own messages never count
        const msgTime = new Date(m.createdAt).getTime();
        return msgTime > lastSeenTime;
      }).length;
    } catch {
      return 0;
    }
  },

  /**
   * Record the moment the user opened a conversation so future unread
   * counts only include messages that arrived AFTER this timestamp.
   * Also tells the backend to mark the conversation as read.
   */
  markAsRead: async (reportId) => {
    if (!reportId) return;

    // Save timestamp locally — this is the source of truth for the badge
    await setCache(lastSeenKey(reportId), new Date().toISOString(), 86400 * 365);

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
