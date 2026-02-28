import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

export default function AttachmentSection() {
  return (
    <View className="mb-5">
      <View className="h-44 items-center justify-center rounded-xl bg-[#F3F4F6]">
        <Ionicons name="camera-outline" size={64} color="#9CA3AF" />
      </View>

      <View className="mt-3 flex-row justify-end">
        <TouchableOpacity activeOpacity={0.8} className="h-12 w-12 items-center justify-center rounded-full bg-[#06B6D4]">
          <Ionicons name="camera" size={22} color="white" />
        </TouchableOpacity>
      </View>

      <Text className="mt-2 text-xs text-[#6B7280]">Attach a photo of the issue (optional)</Text>
    </View>
  );
}
