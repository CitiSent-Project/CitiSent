import { notificationsApi } from "./notifications";

const listeners = new Set();

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
    throw error;
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
  await refreshNotifications();
}
