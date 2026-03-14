import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import NotificationItemCard from "../../components/profile/notifications/NotificationItemCard";
import ProfileSubpageLayout from "../../components/profile/ProfileSubpageLayout";
import { PROFILE_NOTIFICATIONS } from "../../constants/profileNotificationsData";
import usePullToRefresh from "../../hooks/usePullToRefresh";
import { Colors } from "../../constants/colors";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(PROFILE_NOTIFICATIONS);
  const [filterMode, setFilterMode] = useState("all");

  const unreadCount = notifications.filter((item) => !item.read).length;

  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    setFilterMode("all");
    setNotifications(PROFILE_NOTIFICATIONS);
  });

  const visibleNotifications = useMemo(() => {
    if (filterMode === "unread") {
      return notifications.filter((item) => !item.read);
    }

    return notifications;
  }, [filterMode, notifications]);

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  return (
    <ProfileSubpageLayout title="Notifications" refreshing={refreshing} onRefresh={onRefresh}>
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
        visibleNotifications.map((item) => <NotificationItemCard key={item.id} item={item} />)
      ) : (
        <View className="rounded-2xl border px-4 py-8" style={{ borderColor: Colors.borderSoft, backgroundColor: Colors.background }}>
          <Text className="text-center text-sm font-semibold" style={{ color: Colors.text.bodySoft }}>No notifications to show.</Text>
        </View>
      )}
    </ProfileSubpageLayout>
  );
}
