import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../../modules/shared";

export default function ProfileHeader({ name, phone, onEditProfile }) {
  return (
    <View className="px-5 pb-7 pt-6" style={{ backgroundColor: Colors.ui.headerDark }}>
      <View className="flex-row items-center">
        <View className="h-[58px] w-[58px] items-center justify-center rounded-full" style={{ backgroundColor: Colors.ui.profileAvatarSoft }}>
          <Ionicons name="person" size={34} color={Colors.text.secondary} />
        </View>

        <View className="ml-4 flex-1">
          <Text className="text-[20px] font-extrabold text-white" numberOfLines={1}>
            {name}
          </Text>
          <Text className="mt-1 text-base" style={{ color: Colors.text.profileSubtle }}>{phone}</Text>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onEditProfile}
        className="mt-6 self-start rounded-full border px-8 py-2.5"
        style={{ borderColor: Colors.text.profileLink }}
      >
        <Text className="text-sm font-semibold" style={{ color: Colors.text.profileLink }}>Edit Profile</Text>
      </TouchableOpacity>
    </View>
  );
}
