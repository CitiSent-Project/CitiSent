import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ProfileHeader,
  LogoutConfirmSheet,
  ProfileMenuItem,
} from "../../modules/profile";
import { RefreshableScrollView, usePullToRefresh, Colors } from "../../modules/shared";
import { AuthCityFooter, authApi } from "../../modules/auth";
import { getAuthPhoneNumber, getAuthUsername, getAuthGender, getAuthProfileImage } from "../../services/authSession";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);
  const displayUsername = getAuthUsername("");
  const displayPhoneNumber = getAuthPhoneNumber("");
  const displayGender = getAuthGender();
  const displayProfileImage = getAuthProfileImage();
  const { refreshing, onRefresh } = usePullToRefresh(() => {
    setIsLogoutVisible(false);
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
