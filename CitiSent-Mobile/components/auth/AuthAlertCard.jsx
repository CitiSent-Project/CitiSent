import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

const VARIANTS = {
  error: {
    containerClass:
      "mt-3 flex-row items-start gap-x-3 rounded-2xl border border-[#F87171]/40 bg-[#3B1A1A] px-4 py-3",
    iconName: "alert-circle",
    iconColor: "#F87171",
    textClass: "flex-1 text-[13px] leading-[19px] text-[#FCA5A5]",
  },
  success: {
    containerClass:
      "mt-3 flex-row items-start gap-x-3 rounded-2xl border border-[#34D399]/40 bg-[#0E2A23] px-4 py-3",
    iconName: "checkmark-circle",
    iconColor: "#34D399",
    textClass: "flex-1 text-[13px] leading-[19px] text-[#86EFAC]",
  },
};

export default function AuthAlertCard({ variant = "error", message }) {
  if (!message) return null;

  const { containerClass, iconName, iconColor, textClass } = VARIANTS[variant] ?? VARIANTS.error;

  return (
    <View className={containerClass} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Ionicons name={iconName} size={18} color={iconColor} style={{ marginTop: 1 }} />
      <Text className={textClass}>{message}</Text>
    </View>
  );
}
