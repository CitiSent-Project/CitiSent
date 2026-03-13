import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, Text, View } from "react-native";
import { useState } from "react";
import ProfileSubpageLayout from "../../components/profile/ProfileSubpageLayout";
import SettingsToggleRow from "../../components/profile/settings/SettingsToggleRow";
import usePullToRefresh from "../../hooks/usePullToRefresh";

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
      className={`mb-3 flex-row items-center rounded-2xl border px-4 py-4 ${danger ? "border-[#FECACA] bg-[#FEF2F2]" : "border-[#E2E8F0] bg-white"}`}
    >
      <View className={`mr-3 h-9 w-9 items-center justify-center rounded-full ${danger ? "bg-[#FEE2E2]" : "bg-[#EEF2FF]"}`}>
        <Ionicons name={icon} size={18} color={danger ? "#B91C1C" : "#1E40AF"} />
      </View>

      <Text className={`flex-1 text-base font-semibold ${danger ? "text-[#7F1D1D]" : "text-[#0F172A]"}`}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={danger ? "#B91C1C" : "#475569"} />
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
      <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-[#64748B]">Preferences</Text>

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
      <SettingsToggleRow
        title="Enhanced map contrast"
        description="Use stronger map contrast for better road visibility."
        value={settings.darkMapStyle}
        onValueChange={setSetting("darkMapStyle")}
      />
      <SettingsToggleRow
        title="Location access"
        description="Allow the app to suggest nearby location details."
        value={settings.locationAccess}
        onValueChange={setSetting("locationAccess")}
      />

      <Text className="mb-2 mt-2 text-xs font-bold uppercase tracking-wide text-[#64748B]">Account & Security</Text>
      <SettingsActionRow icon="lock-closed-outline" label="Change password" onPress={showComingSoon} />
      <SettingsActionRow icon="shield-checkmark-outline" label="Privacy controls" onPress={showComingSoon} />

      <Text className="mb-2 mt-2 text-xs font-bold uppercase tracking-wide text-[#991B1B]">Danger Zone</Text>
      <SettingsActionRow icon="trash-outline" label="Delete account" onPress={showComingSoon} danger />
    </ProfileSubpageLayout>
  );
}
