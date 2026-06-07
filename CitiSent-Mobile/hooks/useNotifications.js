import { useEffect, useSyncExternalStore } from "react";
import {
  ensureNotificationsLoaded,
  getNotificationsSnapshot,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  refreshNotifications,
  resetNotifications,
  subscribeToNotifications,
  loadMoreNotifications,
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
    isLoadingMore: snapshot.isLoadingMore,
    totalCount: snapshot.totalCount,
    hasMore: snapshot.hasMore,
    error: snapshot.error,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    resetNotifications,
    refreshNotifications,
    loadMoreNotifications,
  };
}
