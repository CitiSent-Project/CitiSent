import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PROFILE_NOTIFICATIONS } from "../../constants/profileNotificationsData";
import { getAuthUsername } from "../../services/authSession";
import NotificationBellButton from "./NotificationBellButton";
import { Colors } from "../../modules/shared";

export default function HomeHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const unreadNotificationCount = useMemo(
    () => PROFILE_NOTIFICATIONS.filter((item) => !item.read).length,
    [],
  );
  const username = useMemo(() => getAuthUsername("Citizen"), []);

  return (
    <View 
      className="px-4 pb-4" 
      style={{ 
        backgroundColor: Colors.ui.headerDark,
        paddingTop: Math.max(insets.top, 8) + 8 // add a bit of padding below status bar
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: Colors.ui.headerAvatarDark }}>
            <Ionicons name="person" size={25} color={Colors.ui.heroSoft} />
          </View>
          <View>
            <Text className="text-sm text-white/90">Hi! Welcome,</Text>
            <Text className="text-lg font-bold text-white">{username}</Text>
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
