import { AppState } from "react-native";
import { notificationsApi, mapBackendNotificationToUi } from "./notifications";
import { setCache, getCache } from "./cache";
import { getSocket } from "./socketService";
import { getAuthUser, getAuthToken, onAuthStateChanged } from "./authSession";
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

let appStateSubscription = null;

function handleNewNotificationPayload(rawPayload) {
  if (!rawPayload || typeof rawPayload !== "object") return;

  const currentUserId = getAuthUser()?.id;
  if (!currentUserId) return;

  // Strict user isolation check
  const targetUserId = rawPayload.user_id || rawPayload.userId;
  if (targetUserId && String(targetUserId) !== String(currentUserId)) {
    return;
  }

  const mapped = mapBackendNotificationToUi(rawPayload, 0);
  if (!mapped || !mapped.id) return;

  // Deduplicate by ID
  const existingIndex = notifications.findIndex((n) => String(n.id) === String(mapped.id));
  if (existingIndex >= 0) {
    // Already exists — update fields in case of newer metadata
    const existing = notifications[existingIndex];
    notifications[existingIndex] = { ...existing, ...mapped };
    emitChange();
    return;
  }

  // Prepend new notification to state immediately
  notifications = [mapped, ...notifications];
  totalCount = Math.max(totalCount + 1, notifications.length);
  emitChange();
}

function handleNotificationUpdatedPayload(rawPayload) {
  if (!rawPayload || typeof rawPayload !== "object") return;
  const targetId = String(rawPayload.id || "");
  if (!targetId) return;

  let didUpdate = false;
  notifications = notifications.map((item) => {
    if (String(item.id) !== targetId) return item;
    didUpdate = true;
    const isRead = Boolean(rawPayload.read ?? rawPayload.is_read ?? item.read);
    const readAt =
      rawPayload.readAt ??
      rawPayload.read_at ??
      (isRead ? item.readAt || new Date().toISOString() : null);
    return {
      ...item,
      read: isRead,
      readAt,
      ...(rawPayload.title ? { title: rawPayload.title } : {}),
      ...(rawPayload.message ? { message: rawPayload.message } : {}),
    };
  });

  if (didUpdate) {
    emitChange();
  }
}

function handleBulkNotificationsUpdatedPayload({ notificationIds, isRead, items }) {
  if (Array.isArray(items) && items.length > 0) {
    const itemMap = new Map(items.map((it) => [String(it.id), it]));
    let didUpdate = false;
    notifications = notifications.map((item) => {
      const incoming = itemMap.get(String(item.id));
      if (!incoming) return item;
      didUpdate = true;
      const readVal = Boolean(incoming.read ?? incoming.is_read ?? isRead);
      return {
        ...item,
        read: readVal,
        readAt:
          incoming.readAt ??
          incoming.read_at ??
          (readVal ? item.readAt || new Date().toISOString() : null),
      };
    });
    if (didUpdate) emitChange();
    return;
  }

  if (Array.isArray(notificationIds) && notificationIds.length > 0) {
    const idSet = new Set(notificationIds.map((id) => String(id)));
    let didUpdate = false;
    notifications = notifications.map((item) => {
      if (!idSet.has(String(item.id))) return item;
      didUpdate = true;
      return {
        ...item,
        read: Boolean(isRead),
        readAt: isRead ? item.readAt || new Date().toISOString() : null,
      };
    });
    if (didUpdate) emitChange();
  }
}

function handleNotificationsClearedPayload({ notificationIds, clearAll }) {
  if (clearAll) {
    notifications = [];
    totalCount = 0;
    emitChange();
    return;
  }

  if (Array.isArray(notificationIds) && notificationIds.length > 0) {
    const idSet = new Set(notificationIds.map((id) => String(id)));
    const initialLen = notifications.length;
    notifications = notifications.filter((item) => !idSet.has(String(item.id)));
    const removedCount = initialLen - notifications.length;
    if (removedCount > 0) {
      totalCount = Math.max(0, totalCount - removedCount);
      emitChange();
    }
  }
}

// Guard to prevent concurrent subscription attempts (e.g. rapid auth events)
let isSubscribingSupabase = false;

/**
 * Fully tears down the existing Supabase channel, calling unsubscribe() first
 * and removing any stale notification channels from the client.
 * This prevents the "cannot add postgres_changes callbacks after subscribe()"
 * error that occurs when a new channel is created with the same topic while
 * the old subscription is still active or cached internally.
 */
async function teardownSupabaseChannel() {
  const channelToRemove = supabaseChannel;
  supabaseChannel = null;

  let client = null;
  try {
    client = getSupabaseClient();
  } catch {}

  if (channelToRemove) {
    try {
      await channelToRemove.unsubscribe();
    } catch {}
    if (client) {
      try {
        client.removeChannel(channelToRemove);
      } catch {}
    }
  }

  // Defensively remove any lingering or stale notification channels from client
  if (client && typeof client.getChannels === "function") {
    const staleChannels = client
      .getChannels()
      .filter((ch) => ch.topic && ch.topic.startsWith("realtime:notifications_realtime_user_"));
    for (const ch of staleChannels) {
      try {
        await ch.unsubscribe();
      } catch {}
      try {
        client.removeChannel(ch);
      } catch {}
    }
  }

  isSubscribingSupabase = false;
}

async function initSupabaseNotificationListener() {
  const user = getAuthUser();
  const userId = user?.id;
  if (!userId) return;

  // Already subscribed or actively subscribing — do not create duplicate channel.
  if (supabaseChannel || isSubscribingSupabase) return;

  let client = null;
  try {
    client = getSupabaseClient();
  } catch {}
  if (!client) return;

  isSubscribingSupabase = true;

  try {
    const topicName = `realtime:notifications_realtime_user_${userId}`;

    // Ensure any existing channel with the same topic is cleanly removed before creating a new one
    if (typeof client.getChannels === "function") {
      const existingChannels = client
        .getChannels()
        .filter(
          (ch) =>
            ch.topic === topicName ||
            (ch.topic && ch.topic.startsWith("realtime:notifications_realtime_user_"))
        );
      for (const existing of existingChannels) {
        try {
          await existing.unsubscribe();
        } catch {}
        try {
          client.removeChannel(existing);
        } catch {}
      }
    }

    const token = getAuthToken();
    if (token && client.realtime?.setAuth) {
      try {
        client.realtime.setAuth(token);
      } catch {}
    }

    const channel = client.channel(`notifications_realtime_user_${userId}`);
    supabaseChannel = channel;

    channel
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
          if (rowUserId && String(rowUserId) !== String(userId)) {
            return;
          }

          if (payload.eventType === "INSERT" && payload.new) {
            handleNewNotificationPayload(payload.new);
          } else if (payload.eventType === "UPDATE" && payload.new) {
            handleNotificationUpdatedPayload(payload.new);
          } else if (payload.eventType === "DELETE" && payload.old) {
            handleNotificationsClearedPayload({ notificationIds: [payload.old.id] });
          } else {
            refreshNotifications().catch(() => {});
          }
        }
      )
      .subscribe((status) => {
        isSubscribingSupabase = false;
        if (status === "SUBSCRIBED") {
          // Connected
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          if (supabaseChannel === channel) {
            supabaseChannel = null;
          }
        }
      });
  } catch (err) {
    isSubscribingSupabase = false;
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

    socket.on("connect", () => {
      // Reconnected: catch up on any missed notifications while disconnected
      if (isHydrated) {
        ensureNotificationsLoaded({ force: true }).catch(() => {});
      }
    });

    socket.on("new_notification", (payload) => {
      if (payload && typeof payload === "object") {
        handleNewNotificationPayload(payload);
      } else {
        refreshNotifications().catch(() => {});
      }
    });

    socket.on("notification_updated", (payload) => {
      if (payload && typeof payload === "object") {
        handleNotificationUpdatedPayload(payload);
      }
    });

    socket.on("notifications_updated", (payload) => {
      if (payload && typeof payload === "object") {
        handleBulkNotificationsUpdatedPayload(payload);
      }
    });

    socket.on("notifications_cleared", (payload) => {
      if (payload && typeof payload === "object") {
        handleNotificationsClearedPayload(payload);
      }
    });

    socket.on("receive_message", () => {
      refreshNotifications().catch(() => {});
    });
    socket.on("new_report_message", () => {
      refreshNotifications().catch(() => {});
    });
    socket.on("report_feed_changed", () => {
      refreshNotifications().catch(() => {});
    });
  } catch {}
}

function initAppStateListener() {
  if (appStateSubscription) return;
  appStateSubscription = AppState.addEventListener("change", (nextAppState) => {
    if (nextAppState === "active") {
      const user = getAuthUser();
      if (user?.id && isHydrated) {
        ensureNotificationsLoaded({ force: true }).catch(() => {});
      }
    }
  });
}

onAuthStateChanged(async (user) => {
  // Properly await tearing down the old channel (unsubscribe + removeChannel)
  // before attempting to open a new channel. Skipping await previously caused
  // channel reuse races and "cannot add postgres_changes callbacks after subscribe()".
  await teardownSupabaseChannel();

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
    await initSupabaseNotificationListener();
    initSocketNotificationListener();
    initAppStateListener();
    ensureNotificationsLoaded({ force: true }).catch(() => {});
  }
});

// If an authenticated user is already active on initial module evaluation, initialize listeners
const initialUser = getAuthUser();
if (initialUser?.id) {
  initSupabaseNotificationListener().catch(() => {});
  initSocketNotificationListener();
  initAppStateListener();
}

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
  if (getAuthUser()?.id && !supabaseChannel && !isSubscribingSupabase) {
    initSupabaseNotificationListener().catch(() => {});
  }
  initSocketNotificationListener();
  initAppStateListener();
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
