import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

export default function RememberMeToggle({ checked, onToggle, className = "" }) {
  return (
    <Pressable
      onPress={onToggle}
      className={["flex-row items-center", className].filter(Boolean).join(" ")}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel="Remember me"
    >
      <View className="mr-2 h-4 w-4 items-center justify-center rounded-[4px] border border-[#D5E6FF] bg-transparent">
        {checked ? <Ionicons name="checkmark" size={12} color="#E7F3FF" /> : null}
      </View>
      <Text className="text-[15px] text-[#8CA8C9]">Remember me</Text>
    </Pressable>
  );
}
