import { PROFILE_NOTIFICATIONS } from "../constants/profileNotificationsData";
import { api } from "./api";
import { getAuthToken } from "./authSession";
import { runtimeFlags } from "./runtimeFlags";

const TEMP_TOKEN_PREFIX = "temp-";
const reportedFallbackWarnings = new Set();

function readArray(payload, key, fallback) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object" && Array.isArray(payload[key])) {
    return payload[key];
  }

  return fallback;
}

function formatRelativeTime(dateValue) {
  const parsedDate = new Date(dateValue);
  const dateMillis = parsedDate.getTime();

  if (Number.isNaN(dateMillis)) {
    return "Just now";
  }

  const elapsedMs = Date.now() - dateMillis;

  if (elapsedMs < 60_000) {
    return "Just now";
  }

  const elapsedMinutes = Math.floor(elapsedMs / 60_000);
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays}d ago`;
}

export function mapBackendNotificationToUi(notification, index = 0) {
  if (!notification || typeof notification !== "object") {
    return null;
  }

  const createdAt = notification.createdAt || notification.created_at;
  const reportId = notification.reportId || notification.report_id || null;

  // Backend uses 'metadata'; some legacy notifications may use 'meta'
  const rawMeta = notification.metadata || notification.meta || null;
  const meta = rawMeta
    ? { reportId, ...rawMeta }
    : reportId
    ? { reportId }
    : null;

  return {
    id: notification.id || `notif-${index + 1}`,
    type: String(notification.type || "system")
      .trim()
      .toLowerCase(),
    title: notification.title || "Notification",
    message: notification.message || "",
    timeLabel: formatRelativeTime(createdAt),
    createdAt: createdAt || null,
    read: Boolean(notification.read ?? notification.is_read),
    reportId,
    meta,
  };
}

function readNotificationsPayload(payload) {
  return readArray(payload, "data", []);
}

function isAuthError(error) {
  const status = error?.status;
  const message = String(error?.message || "").toLowerCase();
  return (
    status === 401 ||
    status === 403 ||
    message.includes("invalid") ||
    message.includes("expired") ||
    message.includes("unauthorized") ||
    message.includes("token")
  );
}

function warnFallbackOnce(label, error) {
  // Auth errors are handled automatically — no need to log them
  if (isAuthError(error)) return;

  const message = error?.message || String(error || "Unknown error");
  const dedupeKey = `${label}:${message}`;

  if (reportedFallbackWarnings.has(dedupeKey)) {
    return;
  }

  reportedFallbackWarnings.add(dedupeKey);
  console.warn(label, message);
}

function shouldUseLocalFallback() {
  if (!runtimeFlags.allowLocalNotificationsFallback) {
    return false;
  }

  const token = getAuthToken();

  if (!token) {
    return true;
  }

  return token.startsWith(TEMP_TOKEN_PREFIX);
}

function cloneLocalNotifications() {
  return PROFILE_NOTIFICATIONS.map((item) => ({ ...item }));
}

export const notificationsApi = {
  async listNotifications(limit = 10, offset = 0) {
    if (shouldUseLocalFallback()) {
      const all = cloneLocalNotifications();
      return {
        data: all.slice(offset, offset + limit),
        total: all.length,
      };
    }

    try {
      const response = await api.get(`/notifications?limit=${limit}&offset=${offset}`);
      const rows = readNotificationsPayload(response)
        .map(mapBackendNotificationToUi)
        .filter((item) => item !== null);

      const total = response?.pagination?.total ?? response?.total ?? rows.length;

      return {
        data: rows,
        total,
      };
    } catch (error) {
      warnFallbackOnce("Falling back to local notifications data:", error);

      if (!runtimeFlags.allowLocalNotificationsFallback) {
        throw error;
      }

      const all = cloneLocalNotifications();
      return {
        data: all.slice(offset, offset + limit),
        total: all.length,
      };
    }
  },

  async markNotificationReadState(notificationId, isRead) {
    if (!notificationId) {
      return null;
    }

    if (shouldUseLocalFallback()) {
      return null;
    }

    return api.patch(`/notifications/${notificationId}/read`, { isRead });
  },

  async markNotificationsReadState({ notificationIds, markAll, isRead }) {
    if (shouldUseLocalFallback()) {
      return null;
    }

    return api.patch("/notifications/read-state", {
      notificationIds,
      markAll,
      isRead,
    });
  },
};
