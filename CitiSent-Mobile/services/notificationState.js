import { notificationsApi } from "./notifications";
import { setCache, getCache } from "./cache";
import { getAuthUser } from "./authSession";

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

    notifications = [...notifications, ...nextNotifications];
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
