import { useEffect, useRef, useState } from "react";
import { Image, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ProfileHeader from "../../components/profile/ProfileHeader";
import LogoutConfirmSheet from "../../components/profile/LogoutConfirmSheet";
import ProfileMenuItem from "../../components/profile/ProfileMenuItem";
import RefreshableScrollView from "../../components/ui/RefreshableScrollView";
import usePullToRefresh from "../../hooks/usePullToRefresh";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);
  const logoutTimerRef = useRef(null);
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

    logoutTimerRef.current = setTimeout(() => {
      router.replace("/login");
    }, 220);
  };

  useEffect(() => {
    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
    };
  }, []);

  return (
    <View className="flex-1 bg-[#E8E8E8]" style={{ paddingTop: insets.top }}>
      <RefreshableScrollView
        className="flex-1"
        contentContainerClassName="flex-grow"
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        <ProfileHeader name="Juan Dela Cruz" phone="09123456789" />

        <View className="pt-4">
          {profileActions.map((item) => (
            <ProfileMenuItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              onPress={() => router.push(item.route)}
            />
          ))}

          <View className="mx-5 mt-2 h-[1px] bg-[#C7C7C7]" />

          <View className="pt-2">
            <ProfileMenuItem icon="log-out-outline" label="Logout" danger onPress={() => setIsLogoutVisible(true)} />
          </View>
        </View>

        <View className="mt-auto overflow-hidden">
          <Image
            source={require("../../assets/logo/cityhall.png")}
            resizeMode="cover"
            className="h-40 w-full opacity-55"
          />
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
