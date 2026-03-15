import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../../../modules/shared";

export default function AttachmentSection() {
  return (
    <View className="mb-5">
      <TouchableOpacity
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Attach a photo of the issue"
        className="h-44 items-center justify-center rounded-xl"
        style={{ backgroundColor: Colors.ui.graySoft }}
      >
        <Ionicons name="camera-outline" size={64} color={Colors.icon.muted} />
        <Text className="mt-2 text-xs" style={{ color: Colors.text.secondary }}>
          Attach a photo of the issue (optional)
        </Text>
      </TouchableOpacity>
    </View>
  );
}
