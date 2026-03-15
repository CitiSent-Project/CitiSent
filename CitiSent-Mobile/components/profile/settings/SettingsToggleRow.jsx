import { Switch, Text, View } from "react-native";
import { Colors } from "../../../modules/shared";

export default function SettingsToggleRow({
  title,
  description,
  value,
  onValueChange,
}) {
  return (
    <View className="mb-3 rounded-2xl border px-4 py-4" style={{ borderColor: Colors.borderSoft, backgroundColor: Colors.background }}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 pr-2">
          <Text className="text-base font-bold" style={{ color: Colors.text.settingsTitle }}>{title}</Text>
          {description ? <Text className="mt-1 text-sm" style={{ color: Colors.text.secondary }}>{description}</Text> : null}
        </View>

        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: Colors.borderMuted, true: Colors.primarySoft }}
          thumbColor={value ? Colors.primaryStrong : Colors.ui.slateSoft}
        />
      </View>
    </View>
  );
}
