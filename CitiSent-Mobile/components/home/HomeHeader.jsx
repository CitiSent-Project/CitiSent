import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../../constants/colors";

export default function HomeHeader() {
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

        <TouchableOpacity className="rounded-full p-2" activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={30} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
