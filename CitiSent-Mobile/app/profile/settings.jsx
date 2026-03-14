import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, Text, View } from "react-native";
import { useState } from "react";
import ProfileSubpageLayout from "../../components/profile/ProfileSubpageLayout";
import SettingsToggleRow from "../../components/profile/settings/SettingsToggleRow";
import usePullToRefresh from "../../hooks/usePullToRefresh";
import { Colors } from "../../constants/colors";

const DEFAULT_SETTINGS = {
  pushNotifications: true,
  emailUpdates: false,
  darkMapStyle: false,
  locationAccess: true,
};

function SettingsActionRow({ icon, label, onPress, danger = false }) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row items-center rounded-2xl border px-4 py-4"
      style={{
        borderColor: danger ? Colors.borderDanger : Colors.borderSoft,
        backgroundColor: danger ? Colors.ui.dangerSoft : Colors.background,
      }}
    >
      <View
        className="mr-3 h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: danger ? Colors.ui.dangerMuted : Colors.ui.brandSoft }}
      >
        <Ionicons name={icon} size={18} color={danger ? Colors.text.danger : Colors.text.link} />
      </View>

      <Text className="flex-1 text-base font-semibold" style={{ color: danger ? Colors.text.dangerDark : Colors.text.heading }}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={danger ? Colors.text.danger : Colors.text.bodySoft} />
    </Pressable>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    setSettings(DEFAULT_SETTINGS);
  });

  const setSetting = (key) => (nextValue) => {
    setSettings((prev) => ({
      ...prev,
      [key]: nextValue,
    }));
  };

  const showComingSoon = () => {
    Alert.alert("Coming soon", "This setting action will be available in a future update.");
  };

  return (
    <ProfileSubpageLayout title="Settings" refreshing={refreshing} onRefresh={onRefresh}>
      <Text className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: Colors.text.secondary }}>Preferences</Text>

      <SettingsToggleRow
        title="Push notifications"
        description="Receive report updates and city alerts in real time."
        value={settings.pushNotifications}
        onValueChange={setSetting("pushNotifications")}
      />
      <SettingsToggleRow
        title="Email updates"
        description="Send major report status changes to your email."
        value={settings.emailUpdates}
        onValueChange={setSetting("emailUpdates")}
      />

      <Text className="mb-2 mt-2 text-xs font-bold uppercase tracking-wide" style={{ color: Colors.text.secondary }}>Account & Security</Text>
      <SettingsActionRow icon="lock-closed-outline" label="Change password" onPress={showComingSoon} />
      <SettingsActionRow icon="shield-checkmark-outline" label="Privacy controls" onPress={showComingSoon} />

      <Text className="mb-2 mt-2 text-xs font-bold uppercase tracking-wide" style={{ color: Colors.text.dangerLabel }}>Danger Zone</Text>
      <SettingsActionRow icon="trash-outline" label="Delete account" onPress={showComingSoon} danger />
    </ProfileSubpageLayout>
  );
}
