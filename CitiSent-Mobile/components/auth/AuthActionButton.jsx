import { Pressable, Text } from "react-native";

export default function AuthActionButton({ label, variant = "primary", onPress, disabled = false }) {
  const isPrimary = variant === "primary";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`mb-3 h-[50px] w-full items-center justify-center rounded-full ${
        isPrimary ? "bg-[#3C75D8]" : "border border-[#DBEAFE] bg-transparent"
      }`}
      style={disabled ? { opacity: 0.65 } : undefined}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text className={`text-[17px] font-semibold ${isPrimary ? "text-[#D8E8FF]" : "text-[#D8E8FF]"}`}>
        {label}
      </Text>
    </Pressable>
  );
}
