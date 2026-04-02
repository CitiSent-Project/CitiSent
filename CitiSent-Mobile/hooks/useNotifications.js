import { useEffect, useSyncExternalStore } from "react";
import {
  ensureNotificationsLoaded,
  getNotificationsSnapshot,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  refreshNotifications,
  resetNotifications,
  subscribeToNotifications,
} from "../services/notificationState";

export default function useNotifications() {
  const snapshot = useSyncExternalStore(
    subscribeToNotifications,
    getNotificationsSnapshot,
    getNotificationsSnapshot,
  );

  useEffect(() => {
    void ensureNotificationsLoaded();
  }, []);

  return {
    notifications: snapshot.notifications,
    unreadCount: snapshot.unreadCount,
    isLoading: snapshot.isLoading,
    error: snapshot.error,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    resetNotifications,
    refreshNotifications,
  };
}
