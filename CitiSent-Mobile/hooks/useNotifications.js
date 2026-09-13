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

  // Initial load on mount (no-op if already hydrated)
  useEffect(() => {
    void ensureNotificationsLoaded();
  }, []);

  return {
    notifications: snapshot.notifications,
    unreadCount: snapshot.unreadCount,
    isLoading: snapshot.isLoading,
    isLoadingMore: snapshot.isLoadingMore,
    focusRefreshing: false,
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
