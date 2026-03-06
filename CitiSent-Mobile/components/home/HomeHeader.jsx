import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

export default function HomeHeader() {
  return (
    <View className="bg-[#223D68] px-4 pb-4 pt-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-[#2F4A72]">
            <Ionicons name="person" size={25} color="#D1E6FF" />
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
