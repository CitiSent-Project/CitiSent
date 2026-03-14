import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../../../constants/colors";

export default function AttachmentSection() {
  return (
    <View className="mb-5">
      <View className="h-44 items-center justify-center rounded-xl" style={{ backgroundColor: Colors.ui.graySoft }}>
        <Ionicons name="camera-outline" size={64} color="#9CA3AF" />
      </View>

      <View className="mt-3 flex-row justify-end">
        <TouchableOpacity
          activeOpacity={0.8}
          className="h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: Colors.ui.accentCyan }}
        >
          <Ionicons name="camera" size={22} color="white" />
        </TouchableOpacity>
      </View>

      <Text className="mt-2 text-xs text-[#6B7280]">Attach a photo of the issue (optional)</Text>
    </View>
  );
}
