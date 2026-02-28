import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function NearbyGalleryView() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Ionicons name="images-outline" size={48} color="#B0BEC5" />
      <Text className="mt-3 text-base font-semibold text-[#9CA3AF]">Gallery view coming soon</Text>
    </View>
  );
}
