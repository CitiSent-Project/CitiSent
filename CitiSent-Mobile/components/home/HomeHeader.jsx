import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Text, View, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PROFILE_NOTIFICATIONS } from "../../constants/profileNotificationsData";
import { getAuthUsername, getAuthGender, getAuthProfileImage } from "../../services/authSession";
import NotificationBellButton from "./NotificationBellButton";
import { Colors } from "../../modules/shared";
import { DEFAULT_PROFILE_IMAGES } from "../../constants/profileImages";

export default function HomeHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const unreadNotificationCount = useMemo(
    () => PROFILE_NOTIFICATIONS.filter((item) => !item.read).length,
    [],
  );
  const username = useMemo(() => getAuthUsername(""), []);
  const gender = useMemo(() => getAuthGender(), []);
  const profileImage = useMemo(() => getAuthProfileImage(), []);

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
            {profileImage || gender ? (
              <Image
                source={profileImage ? profileImage : gender === "male" ? DEFAULT_PROFILE_IMAGES.male : gender === "female" ? DEFAULT_PROFILE_IMAGES.female : null}
                style={{ width: 38, height: 38, borderRadius: 19 }}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person" size={25} color={Colors.ui.heroSoft} />
            )}
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
