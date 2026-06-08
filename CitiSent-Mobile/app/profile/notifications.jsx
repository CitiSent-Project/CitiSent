import { useMemo, useState } from "react";
import { Pressable, Text, View, ActivityIndicator } from "react-native";
import {
  NotificationItemCard,
  ProfileSubpageLayout,
} from "../../modules/profile";
import NotificationDetailsModal from "../../components/profile/notifications/NotificationDetailsModal";
import { usePullToRefresh, useNotifications, Colors } from "../../modules/shared";

export default function NotificationsPage() {
  const [filterMode, setFilterMode] = useState("all");
  const [selectedNotification, setSelectedNotification] = useState(null);

  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    resetNotifications,
    isLoadingMore,
    focusRefreshing,
    totalCount,
    hasMore,
    loadMoreNotifications,
  } = useNotifications();

  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    setFilterMode("all");
    await resetNotifications();
  });


  const visibleNotifications = useMemo(() => {
    if (filterMode === "unread") {
      return notifications.filter((item) => !item.read);
    }

    return notifications;
  }, [filterMode, notifications]);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      console.warn("Failed to mark all notifications as read:", error?.message || error);
    }
  };

  const handleNotificationPress = async (item) => {
    setSelectedNotification(item);
    if (!item.read) {
      try {
        await markNotificationAsRead(item.id);
      } catch (error) {
        console.warn("Failed to mark notification as read:", error?.message || error);
      }
    }
  };

  return (
    <ProfileSubpageLayout title="Notifications" refreshing={refreshing} onRefresh={onRefresh}>
      {focusRefreshing && (
        <View
          className="mb-3 flex-row items-center gap-2 rounded-xl px-4 py-3"
          style={{ backgroundColor: Colors.ui?.neutralSoft ?? "#f3f4f6" }}
        >
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text className="text-xs font-semibold" style={{ color: Colors.text.secondary }}>
            Refreshing notifications…
          </Text>
        </View>
      )}

      <View className="mb-4 rounded-2xl border px-4 py-4" style={{ borderColor: Colors.borderSoft, backgroundColor: Colors.background }}>

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-base font-extrabold" style={{ color: Colors.text.heading }}>Inbox</Text>
            <Text className="mt-1 text-sm" style={{ color: Colors.text.secondary }}>{unreadCount} unread notification(s)</Text>
          </View>

          <Pressable onPress={handleMarkAllAsRead} className="rounded-lg px-3 py-2" style={{ backgroundColor: Colors.ui.neutralSoft }}>
            <Text className="text-xs font-bold" style={{ color: Colors.text.body }}>Mark all read</Text>
          </Pressable>
        </View>

        <View className="mt-4 flex-row gap-2">
          <Pressable
            onPress={() => setFilterMode("all")}
            className="rounded-full border px-4 py-2"
            style={{
              borderColor: filterMode === "all" ? Colors.primaryStrong : Colors.borderMuted,
              backgroundColor: filterMode === "all" ? Colors.primaryStrong : Colors.background,
            }}
          >
            <Text className="text-xs font-bold" style={{ color: filterMode === "all" ? Colors.text.inverse : Colors.text.body }}>All</Text>
          </Pressable>

          <Pressable
            onPress={() => setFilterMode("unread")}
            className="rounded-full border px-4 py-2"
            style={{
              borderColor: filterMode === "unread" ? Colors.primaryStrong : Colors.borderMuted,
              backgroundColor: filterMode === "unread" ? Colors.primaryStrong : Colors.background,
            }}
          >
            <Text className="text-xs font-bold" style={{ color: filterMode === "unread" ? Colors.text.inverse : Colors.text.body }}>Unread</Text>
          </Pressable>
        </View>
      </View>

      {visibleNotifications.length > 0 ? (
        <>
          {visibleNotifications.map((item) => (
            <NotificationItemCard
              key={item.id}
              item={item}
              onPress={() => handleNotificationPress(item)}
            />
          ))}

          {hasMore && filterMode === "all" && (
            <View className="my-5 pb-10 items-center">
              <Pressable
                onPress={loadMoreNotifications}
                disabled={isLoadingMore}
                className="w-full rounded-xl border py-3 items-center justify-center flex-row gap-2"
                style={{
                  borderColor: Colors.borderMuted || Colors.border,
                  backgroundColor: Colors.background || "#ffffff",
                }}
              >
                {isLoadingMore ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Text className="text-sm font-bold" style={{ color: Colors.primary }}>
                    Load More Notifications ({notifications.length} of {totalCount})
                  </Text>
                )}
              </Pressable>
            </View>
          )}

          {!hasMore && filterMode === "all" && notifications.length > 0 && (
            <Text className="my-5 pb-10 text-center text-sm font-bold" style={{ color: Colors.text.slate || Colors.text.secondary }}>
              Showing all {totalCount} notifications
            </Text>
          )}
        </>
      ) : (
        <View className="rounded-2xl border px-4 py-8" style={{ borderColor: Colors.borderSoft, backgroundColor: Colors.background }}>
          <Text className="text-center text-sm font-semibold" style={{ color: Colors.text.bodySoft }}>No notifications to show.</Text>
        </View>
      )}

      <NotificationDetailsModal
        visible={!!selectedNotification}
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
      />
    </ProfileSubpageLayout>
  );
}
