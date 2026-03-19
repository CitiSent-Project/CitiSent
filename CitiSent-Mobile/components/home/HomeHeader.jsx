import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Text, View } from "react-native";
import { PROFILE_NOTIFICATIONS } from "../../constants/profileNotificationsData";
import NotificationBellButton from "./NotificationBellButton";
import { Colors } from "../../modules/shared";

export default function HomeHeader() {
  const router = useRouter();

  const unreadNotificationCount = useMemo(
    () => PROFILE_NOTIFICATIONS.filter((item) => !item.read).length,
    [],
  );

  return (
    <View className="px-4 pb-4 pt-2" style={{ backgroundColor: Colors.ui.headerDark }}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: Colors.ui.headerAvatarDark }}>
            <Ionicons name="person" size={25} color={Colors.ui.heroSoft} />
          </View>
          <View>
            <Text className="text-xs text-white/90">Hi! Welcome,</Text>
            <Text className="text-sm font-bold text-white">Juan Dela Cruz</Text>
          </View>
        </View>

        <NotificationBellButton
          notificationCount={unreadNotificationCount}
          onPress={() => router.push("/profile/notifications")}
        />
      </View>
    </View>
  );
}
