import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../../modules/shared";

export default function ProfileMenuItem({ icon, label, iconColor = Colors.icon.primary, onPress, danger = false, showBadge = false }) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      className="flex-row items-center px-5 py-5"
    >
      <View className="h-8 w-8 items-center justify-center">
        <Ionicons name={icon} size={25} color={danger ? Colors.icon.danger : iconColor} />
      </View>

      <Text className={`ml-3 flex-1 text-[20px] ${danger ? "font-bold text-black" : "text-black"}`}>
        {label}
      </Text>

      {showBadge && (
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: Colors.error ?? "#ef4444",
            marginRight: 8,
          }}
        />
      )}

      <Ionicons name="chevron-forward" size={22} color={Colors.icon.chevron} />
    </TouchableOpacity>
  );
}

