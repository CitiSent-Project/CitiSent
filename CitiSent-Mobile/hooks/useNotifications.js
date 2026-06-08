import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useFocusEffect } from "expo-router";
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

  const [focusRefreshing, setFocusRefreshing] = useState(false);
  const isFetchingRef = useRef(false);

  // Initial load on mount (no-op if already hydrated)
  useEffect(() => {
    void ensureNotificationsLoaded();
  }, []);

  // Force-refresh every time this screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;
      setFocusRefreshing(true);

      refreshNotifications()
        .catch(() => {
          // Errors are stored in the shared state; nothing extra needed here.
        })
        .finally(() => {
          isFetchingRef.current = false;
          setFocusRefreshing(false);
        });
    }, []),
  );

  return {
    notifications: snapshot.notifications,
    unreadCount: snapshot.unreadCount,
    isLoading: snapshot.isLoading,
    isLoadingMore: snapshot.isLoadingMore,
    focusRefreshing,
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
