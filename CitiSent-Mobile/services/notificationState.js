import { PROFILE_NOTIFICATIONS } from "../constants/profileNotificationsData";

const listeners = new Set();
const initialNotifications = PROFILE_NOTIFICATIONS.map((item) => ({ ...item }));

let notifications = initialNotifications.map((item) => ({ ...item }));

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function subscribeToNotifications(listener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getNotifications() {
  return notifications;
}

export function markNotificationAsRead(notificationId) {
  if (!notificationId) {
    return;
  }

  let didUpdate = false;

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
}

export function markAllNotificationsAsRead() {
  let didUpdate = false;

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
}

export function resetNotifications() {
  notifications = initialNotifications.map((item) => ({ ...item }));
  emitChange();
}
