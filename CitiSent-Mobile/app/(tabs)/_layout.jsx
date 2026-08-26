import { View } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, useNotifications } from "../../modules/shared";
import { useAdminMessageState } from "../../contexts/AdminMessageContext";

/**
 * Profile tab icon with a shared real-time red notification dot.
 * Reads hasUnreadAdminMessage and unread notifications from the singleton-backed store
 * so it updates immediately on Realtime events regardless of which screen is active.
 */
function ProfileTabIcon({ color, size }) {
  const { hasUnreadAdminMessage } = useAdminMessageState();
  const { unreadCount } = useNotifications();
  const hasBadge = Boolean(hasUnreadAdminMessage || unreadCount > 0);

  return (
    <View style={{ position: "relative" }}>
      <Ionicons name="person-outline" size={size} color={color} />
      {hasBadge && (
        <View
          style={{
            position: "absolute",
            top: -2,
            right: -4,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: Colors.error ?? "#ef4444",
            borderWidth: 1.5,
            borderColor: Colors.surface ?? "#ffffff",
          }}
        />
      )}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.secondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60 + Math.max(insets.bottom, 10),
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 8,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="CreateReport"
        options={{
          title: "Create Report",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="create-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="MyReports"
        options={{
          title: "My Reports",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Profile"
        options={{
          title: "Profile",
          tabBarIcon: (props) => <ProfileTabIcon {...props} />,
        }}
      />
    </Tabs>
  );
}



