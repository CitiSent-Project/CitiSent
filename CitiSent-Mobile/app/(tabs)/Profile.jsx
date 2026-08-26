import { useState, useCallback } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ProfileHeader,
  LogoutConfirmSheet,
  ProfileMenuItem,
} from "../../modules/profile";
import { RefreshableScrollView, usePullToRefresh, useNotifications, Colors } from "../../modules/shared";
import { AuthCityFooter, authApi } from "../../modules/auth";
import { getAuthPhoneNumber, getAuthUsername, getAuthGender, getAuthProfileImage } from "../../services/authSession";
import { useAdminMessageState } from "../../contexts/AdminMessageContext";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);

  // Shared real-time notification state from the global singleton
  const { hasUnreadAdminMessage } = useAdminMessageState();
  const { unreadCount, refreshNotifications } = useNotifications();

  // Fix 2: store session-derived values in state so they update when the
  // screen regains focus (e.g. after returning from Edit Profile).
  const [displayUsername, setDisplayUsername] = useState(() => getAuthUsername(""));
  const [displayPhoneNumber, setDisplayPhoneNumber] = useState(() => getAuthPhoneNumber(""));
  const [displayGender, setDisplayGender] = useState(() => getAuthGender());
  const [displayProfileImage, setDisplayProfileImage] = useState(() => getAuthProfileImage());

  // Re-read auth session every time this screen is focused so that profile
  // edits are immediately reflected in the header.
  useFocusEffect(
    useCallback(() => {
      setDisplayUsername(getAuthUsername(""));
      setDisplayPhoneNumber(getAuthPhoneNumber(""));
      setDisplayGender(getAuthGender());
      setDisplayProfileImage(getAuthProfileImage());
    }, [])
  );

  const { refreshing, onRefresh } = usePullToRefresh(() => {
    setIsLogoutVisible(false);
    // Refresh session-derived display values on pull-to-refresh too
    setDisplayUsername(getAuthUsername(""));
    setDisplayPhoneNumber(getAuthPhoneNumber(""));
    setDisplayGender(getAuthGender());
    setDisplayProfileImage(getAuthProfileImage());
    refreshNotifications().catch(() => {});
  });

  const profileActions = [
    {
      id: "reports",
      label: "Manage Reports",
      icon: "document-text-outline",
      route: "/profile/reports",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: "notifications-outline",
      route: "/profile/notifications",
    },
    {
      id: "settings",
      label: "Settings",
      icon: "settings-outline",
      route: "/profile/settings",
    },
  ];

  const handleConfirmLogout = () => {
    setIsLogoutVisible(false);

    authApi.logout();
    router.replace("/auth/Login");
  };

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.screen.profile }}>
      <AuthCityFooter backgroundColor={Colors.screen.profile} />

      <RefreshableScrollView
        className="flex-1"
        contentContainerClassName="flex-grow pb-44"
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        <ProfileHeader
          name={displayUsername}
          phone={displayPhoneNumber}
          gender={displayGender}
          profileImage={displayProfileImage}
          onEditProfile={() => router.push("/profile/edit")}
        />

        <View className="pt-4">
          {profileActions.map((item) => (
            <ProfileMenuItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              onPress={() => router.push(item.route)}
              showBadge={
                (item.id === "reports" && hasUnreadAdminMessage) ||
                (item.id === "notifications" && unreadCount > 0)
              }
            />
          ))}

          <View className="mx-5 mt-2 h-[1px]" style={{ backgroundColor: Colors.divider }} />

          <View className="pt-2">
            <ProfileMenuItem icon="log-out-outline" label="Logout" danger onPress={() => setIsLogoutVisible(true)} />
          </View>
        </View>
      </RefreshableScrollView>

      <LogoutConfirmSheet
        visible={isLogoutVisible}
        onCancel={() => setIsLogoutVisible(false)}
        onConfirm={handleConfirmLogout}
        bottomInset={insets.bottom}
      />
    </View>
  );
}
