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
      <View className="mb-4 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-base font-extrabold text-[#0F172A]">Inbox</Text>
            <Text className="mt-1 text-sm text-[#64748B]">{unreadCount} unread notification(s)</Text>
          </View>

          <Pressable onPress={handleMarkAllAsRead} className="rounded-lg px-3 py-2" style={{ backgroundColor: Colors.ui.neutralSoft }}>
            <Text className="text-xs font-bold text-[#334155]">Mark all read</Text>
          </Pressable>
        </View>

        <View className="mt-4 flex-row gap-2">
          <Pressable
            onPress={() => setFilterMode("all")}
            className={`rounded-full border px-4 py-2 ${filterMode === "all" ? "border-[#1D4ED8]" : "border-[#CBD5E1] bg-white"}`}
            style={filterMode === "all" ? { backgroundColor: Colors.primaryStrong } : undefined}
          >
            <Text className={`text-xs font-bold ${filterMode === "all" ? "text-white" : "text-[#334155]"}`}>All</Text>
          </Pressable>

          <Pressable
            onPress={() => setFilterMode("unread")}
            className={`rounded-full border px-4 py-2 ${filterMode === "unread" ? "border-[#1D4ED8]" : "border-[#CBD5E1] bg-white"}`}
            style={filterMode === "unread" ? { backgroundColor: Colors.primaryStrong } : undefined}
          >
            <Text className={`text-xs font-bold ${filterMode === "unread" ? "text-white" : "text-[#334155]"}`}>Unread</Text>
          </Pressable>
        </View>
      </View>

      {visibleNotifications.length > 0 ? (
        visibleNotifications.map((item) => <NotificationItemCard key={item.id} item={item} />)
      ) : (
        <View className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-8">
          <Text className="text-center text-sm font-semibold text-[#475569]">No notifications to show.</Text>
        </View>
      )}
    </ProfileSubpageLayout>
  );
}
