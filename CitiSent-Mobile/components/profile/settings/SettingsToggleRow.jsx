import { Switch, Text, View } from "react-native";

export default function SettingsToggleRow({
  title,
  description,
  value,
  onValueChange,
}) {
  return (
    <View className="mb-3 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 pr-2">
          <Text className="text-base font-bold text-[#1E293B]">{title}</Text>
          {description ? <Text className="mt-1 text-sm text-[#64748B]">{description}</Text> : null}
        </View>

        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: "#CBD5E1", true: "#93C5FD" }}
          thumbColor={value ? "#1D4ED8" : "#F8FAFC"}
        />
      </View>
    </View>
  );
}
