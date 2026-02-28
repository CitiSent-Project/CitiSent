import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function PageTopBar({ title }) {
  const router = useRouter();

  return (
    <View className="flex-row items-center bg-[#223D68] px-3 py-5">
      <View className="flex-row items-center">
        <TouchableOpacity activeOpacity={0.7} className="p-1" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#DCE9F8" />
        </TouchableOpacity>

        <Text className="ml-2 text-[22px] font-bold text-white">{title}</Text>
      </View>
    </View>
  );
}