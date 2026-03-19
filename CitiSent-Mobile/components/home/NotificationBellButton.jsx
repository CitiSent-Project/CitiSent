import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../../modules/shared";

const BADGE_MAX_COUNT = 99;

function getBadgeLabel(notificationCount) {
  if (notificationCount > BADGE_MAX_COUNT) {
    return `${BADGE_MAX_COUNT}+`;
  }

  return String(notificationCount);
}

export default function NotificationBellButton({ notificationCount = 0, onPress }) {
  const hasNotifications = notificationCount > 0;

  return (
    <TouchableOpacity
      className="rounded-full p-2"
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Open notifications"
    >
      <View>
        <Ionicons name="notifications-outline" size={30} color="white" />

        {hasNotifications ? (
          <View
            className="absolute -right-2 -top-1 min-w-[20px] items-center justify-center rounded-full px-1"
            style={{ backgroundColor: Colors.error }}
          >
            <Text className="text-[10px] font-bold" style={{ color: Colors.text.inverse }}>
              {getBadgeLabel(notificationCount)}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
