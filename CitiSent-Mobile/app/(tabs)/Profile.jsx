import { Image, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileMenuItem from "../../components/profile/ProfileMenuItem";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const profileActions = [
    {
      id: "reports",
      label: "Reports made by you",
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

  return (
    <View className="flex-1 bg-[#E8E8E8]" style={{ paddingTop: insets.top }}>
      <ProfileHeader name="John Eduard A. Madriaga" phone="09123456789" />

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
          <ProfileMenuItem icon="log-out-outline" label="Logout" danger />
        </View>
      </View>

      <View className="mt-auto overflow-hidden">
        <Image
          source={require("../../assets/logo/cityhall.png")}
          resizeMode="cover"
          className="h-40 w-full opacity-55"
        />
      </View>
    </View>
  );
}
