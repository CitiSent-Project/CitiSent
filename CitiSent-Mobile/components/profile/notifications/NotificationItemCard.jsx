import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { Colors } from "../../../constants/colors";

const iconByType = {
  report: "document-text-outline",
  status: "checkmark-done-circle-outline",
  account: "person-circle-outline",
  alert: "warning-outline",
};

export default function NotificationItemCard({ item }) {
  const iconName = iconByType[item.type] || "notifications-outline";
  const isRead = Boolean(item.read);

  return (
    <View
      className="mb-3 rounded-2xl border px-4 py-4"
      style={{ borderColor: isRead ? Colors.borderSoft : Colors.ui.infoSurfaceBorderStrong, backgroundColor: isRead ? Colors.surface : Colors.ui.infoSurface }}
    >
      <View className="flex-row items-start gap-3">
        <View
          className="mt-1 h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: isRead ? Colors.ui.neutralSoft : Colors.ui.infoSurfaceBorder }}
        >
          <Ionicons name={iconName} size={18} color={isRead ? Colors.text.secondary : Colors.primaryStrong} />
        </View>

        <View className="flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <Text className="flex-1 text-base font-bold" style={{ color: Colors.text.heading }}>{item.title}</Text>
            {!item.read ? (
              <View className="mt-1 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: Colors.ui.indicatorBlue }} />
            ) : null}
          </View>

          <Text className="mt-1 text-sm leading-5" style={{ color: Colors.text.body }}>{item.message}</Text>
          <Text className="mt-2 text-xs font-semibold" style={{ color: Colors.text.secondary }}>{item.timeLabel}</Text>
        </View>
      </View>
    </View>
  );
}
