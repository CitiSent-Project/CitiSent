import { notificationsApi } from "./notifications";
import { setCache, getCache } from "./cache";
import { getSocket } from "./socketService";
import { getAuthUser, onAuthStateChanged } from "./authSession";
import { getSupabaseClient } from "./supabase";

const listeners = new Set();

/**
 * Per-user cache key for notifications state.
 * Namespaced by user ID to prevent data leaking between users on shared
 * devices. Fix for Issue #3 (no per-user cache isolation).
 */
function getNotificationsCacheKey() {
  const uid = getAuthUser()?.id ?? "anon";
  return `notifications_state_${uid}`;
}

let notifications = [];
let totalCount = 0;
let isHydrated = false;
let isLoading = false;
let isLoadingMore = false;
let lastError = null;
let offset = 0;
const LIMIT = 10;
let isSocketInitialized = false;
let supabaseChannel = null;

function initSupabaseNotificationListener() {
  const user = getAuthUser();
  const userId = user?.id;
  if (!userId) return;

  if (supabaseChannel) return;
  try {
    const client = getSupabaseClient();
    if (!client) return;

    supabaseChannel = client
      .channel(`notifications_realtime_user_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const rowUserId = payload.new?.user_id || payload.old?.user_id;
          if (rowUserId && String(rowUserId) === String(userId)) {
            refreshNotifications().catch(() => {});
          }
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          supabaseChannel = null;
        }
      });
  } catch (err) {
    console.warn("[notificationState] Failed to subscribe to Supabase Realtime:", err?.message);
    supabaseChannel = null;
  }
}

function initSocketNotificationListener() {
  if (isSocketInitialized) return;
  try {
    const socket = getSocket();
    if (!socket) return;
    isSocketInitialized = true;
    socket.on("receive_message", () => {
      refreshNotifications().catch(() => {});
    });
    socket.on("new_report_message", () => {
      refreshNotifications().catch(() => {});
    });
    socket.on("new_notification", () => {
      refreshNotifications().catch(() => {});
    });
    socket.on("report_feed_changed", () => {
      refreshNotifications().catch(() => {});
    });
  } catch {}
}

onAuthStateChanged((user) => {
  if (supabaseChannel) {
    try {
      const client = getSupabaseClient();
      if (client) client.removeChannel(supabaseChannel);
    } catch {}
    supabaseChannel = null;
  }

  // Reset in-memory notification state when user logs out or switches
  notifications = [];
  totalCount = 0;
  offset = 0;
  isHydrated = false;
  lastError = null;
  emitChange();

  if (!user) {
    isSocketInitialized = false;
  } else {
    initSupabaseNotificationListener();
    initSocketNotificationListener();
    ensureNotificationsLoaded({ force: true }).catch(() => {});
  }
});

function getUnreadCount(items = []) {
  return items.filter((item) => !item.read).length;
}

function buildSnapshot() {
  return {
    notifications,
    unreadCount: getUnreadCount(notifications),
    isHydrated,
    isLoading,
    isLoadingMore,
    totalCount,
    hasMore: notifications.length < totalCount,
    error: lastError,
  };
}

let cachedSnapshot = buildSnapshot();

function emitChange() {
  cachedSnapshot = buildSnapshot();
  listeners.forEach((listener) => listener());

  // Persist to storage in background (no TTL — data is always refreshed on
  // next hydration via the API call that follows immediately after cache load).
  // Fix for Issue #4: removed the 10-min TTL that was set but then ignored via
  // ignoreExpiry: true on every read, making it meaningless decoration.
  if (isHydrated) {
    setCache(getNotificationsCacheKey(), { notifications, totalCount });
  }
}

function updateNotifications(nextNotifications) {
  notifications = Array.isArray(nextNotifications)
    ? nextNotifications.map((item) => ({ ...item }))
    : [];
  emitChange();
}

function setLoadingState(value) {
  if (isLoading === value) {
    return;
  }

  isLoading = value;
  emitChange();
}

function setLastError(error) {
  const nextError = error || null;

  if (lastError === nextError) {
    return;
  }

  lastError = nextError;
  emitChange();
}

export function subscribeToNotifications(listener) {
  initSupabaseNotificationListener();
  initSocketNotificationListener();
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getNotificationsSnapshot() {
  return cachedSnapshot;
}

export async function ensureNotificationsLoaded({ force = false } = {}) {
  if (isLoading) {
    return;
  }

  if (isHydrated && !force) {
    return;
  }

  // Hydrate from persistent disk cache immediately if available
  if (!isHydrated) {
    try {
      // No ignoreExpiry here — we don't set a TTL anymore, so this is a
      // simple presence check. Fix for Issue #4.
      const cached = await getCache(getNotificationsCacheKey());
      if (cached && Array.isArray(cached.notifications) && cached.notifications.length > 0) {
        notifications = cached.notifications;
        totalCount = cached.totalCount || notifications.length;
        isHydrated = true;
        emitChange();
      }
    } catch (err) {
      console.warn("Failed to read notifications cache:", err);
    }
  }

  setLoadingState(true);

  try {
    const res = await notificationsApi.listNotifications(LIMIT, 0);
    notifications = Array.isArray(res?.data)
      ? res.data.map((item) => ({ ...item }))
      : [];
    totalCount = res?.total ?? notifications.length;
    offset = 0;
    isHydrated = true;
    lastError = null;
    emitChange();
  } catch (error) {
    setLastError(error);
    if (!isHydrated) {
      throw error;
    }
  } finally {
    setLoadingState(false);
  }
}

export async function loadMoreNotifications() {
  if (isLoadingMore || notifications.length >= totalCount) {
    return;
  }

  isLoadingMore = true;
  emitChange();

  try {
    const nextOffset = offset + LIMIT;
    const res = await notificationsApi.listNotifications(LIMIT, nextOffset);
    const nextNotifications = Array.isArray(res?.data)
      ? res.data.map((item) => ({ ...item }))
      : [];

    const existingIds = new Set(notifications.map((n) => String(n.id)));
    const uniqueNew = nextNotifications.filter((item) => !existingIds.has(String(item.id)));
    notifications = [...notifications, ...uniqueNew];
    totalCount = res?.total ?? notifications.length;
    offset = nextOffset;
    lastError = null;
  } catch (error) {
    setLastError(error);
    throw error;
  } finally {
    isLoadingMore = false;
    emitChange();
  }
}

export async function refreshNotifications() {
  await ensureNotificationsLoaded({ force: true });
}

export async function markNotificationAsRead(notificationId) {
  if (!notificationId) {
    return;
  }

  let didUpdate = false;
  let previousNotifications = notifications;

  notifications = notifications.map((item) => {
    if (item.id !== notificationId || item.read) {
      return item;
    }

    didUpdate = true;
    return { ...item, read: true };
  });

  if (didUpdate) {
    emitChange();
  }

  try {
    await notificationsApi.markNotificationReadState(notificationId, true);
  } catch (error) {
    previousNotifications = previousNotifications || [];
    updateNotifications(previousNotifications);
    setLastError(error);
    throw error;
  }
}

export async function markAllNotificationsAsRead() {
  let didUpdate = false;
  let previousNotifications = notifications;

  notifications = notifications.map((item) => {
    if (item.read) {
      return item;
    }

    didUpdate = true;
    return { ...item, read: true };
  });

  if (didUpdate) {
    emitChange();
  }

  try {
    await notificationsApi.markNotificationsReadState({
      markAll: true,
      notificationIds: undefined,
      isRead: true,
    });
  } catch (error) {
    previousNotifications = previousNotifications || [];
    updateNotifications(previousNotifications);
    setLastError(error);
    throw error;
  }
}

export async function resetNotifications() {
  // Synchronously zero out all module-level state before fetching so that
  // a newly logged-in user never sees the previous user's notifications even
  // briefly while the API call is in flight. Fix for Issue #8.
  notifications = [];
  totalCount = 0;
  offset = 0;
  isHydrated = false;
  lastError = null;
  emitChange();
  await refreshNotifications();
}
