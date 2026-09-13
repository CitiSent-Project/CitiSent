import React, { useState, useCallback } from "react";
import { View, Text, Pressable } from "react-native";
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
import {
  getAuthPhoneNumber,
  getAuthEmail,
  getAuthUsername,
  getAuthGender,
  getAuthProfileImage,
  isGuestUser,
  isGuestVerified,
} from "../../services/authSession";
import { useAdminMessageState } from "../../contexts/AdminMessageContext";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);

  // Shared real-time notification state from the global singleton
  const { hasUnreadAdminMessage } = useAdminMessageState();
  const { unreadCount, refreshNotifications } = useNotifications();

  const isGuest = isGuestUser();
  const isVerified = isGuestVerified();

  const resolveDisplayName = () => {
    if (isGuest) return "Guest User";
    return getAuthUsername("");
  };

  const resolveDisplayPhone = () => {
    if (isGuest) {
      return getAuthEmail("") || "Guest Account";
    }
    const raw = getAuthPhoneNumber("");
    if (raw) return raw;
    return "";
  };

  const [displayUsername, setDisplayUsername] = useState(resolveDisplayName);
  const [displayPhoneNumber, setDisplayPhoneNumber] = useState(resolveDisplayPhone);
  const [displayGender, setDisplayGender] = useState(() => getAuthGender());
  const [displayProfileImage, setDisplayProfileImage] = useState(() => getAuthProfileImage());

  // Re-read auth session every time this screen is focused so that profile
  // edits are immediately reflected in the header.
  useFocusEffect(
    useCallback(() => {
      setDisplayUsername(resolveDisplayName());
      setDisplayPhoneNumber(resolveDisplayPhone());
      setDisplayGender(getAuthGender());
      setDisplayProfileImage(getAuthProfileImage());
    }, [isGuest, isVerified])
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
          onEditProfile={() => {
            if (isGuest) {
              router.push("/auth/CreateAccount");
            } else {
              router.push("/profile/edit");
            }
          }}
        />

        {isGuest && (
          <View className="mx-4 mt-3 rounded-2xl bg-blue-50 border border-blue-200 p-4">
            <Text className="text-sm font-bold text-blue-900">Guest Account</Text>
            <Text className="mt-1 text-xs text-blue-700 leading-4">
              {isVerified
                ? "Your Gmail address is verified. Create a permanent account anytime to keep your reports saved."
                : "You are browsing as a guest. Create a full account to submit reports and access all features."}
            </Text>
            <Pressable
              onPress={() => router.push("/auth/CreateAccount")}
              className="mt-3 self-start rounded-xl bg-blue-700 px-4 py-2"
            >
              <Text className="text-xs font-bold text-white">Create Full Account</Text>
            </Pressable>
          </View>
        )}

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
            <ProfileMenuItem
              icon="log-out-outline"
              label={isGuest ? "Exit Guest Mode" : "Logout"}
              danger
              onPress={() => setIsLogoutVisible(true)}
            />
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
