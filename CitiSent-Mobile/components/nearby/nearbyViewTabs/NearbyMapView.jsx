import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function NearbyMapView() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Ionicons name="map-outline" size={48} color="#B0BEC5" />
      <Text className="mt-3 text-base font-semibold text-[#9CA3AF]">Map view coming soon</Text>
    </View>
  );
}
