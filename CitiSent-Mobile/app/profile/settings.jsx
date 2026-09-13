import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, Text, View } from "react-native";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ProfileSubpageLayout,
  ChangePasswordSheet,
  DeleteAccountSheet,
} from "../../modules/profile";
import { Colors } from "../../modules/shared";
import { usersApi } from "../../services/users";
import { clearAuthToken, isGuestUser } from "../../services/authSession";

function SettingsActionRow({ icon, label, onPress, danger = false, disabled = false, value }) {
  return (
    <Pressable
      onPress={disabled || !onPress ? undefined : onPress}
      className="mb-3 flex-row items-center rounded-2xl border px-4 py-4"
      style={{
        borderColor: danger ? Colors.borderDanger : Colors.borderSoft,
        backgroundColor: danger ? Colors.ui.dangerSoft : Colors.background,
        opacity: disabled ? 0.5 : 1,
      }}
      disabled={disabled || !onPress}
    >
      <View
        className="mr-3 h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: danger ? Colors.ui.dangerMuted : Colors.ui.brandSoft }}
      >
        <Ionicons name={icon} size={18} color={danger ? Colors.text.danger : Colors.text.link} />
      </View>

      <Text className="flex-1 text-base font-semibold" style={{ color: danger ? Colors.text.dangerDark : Colors.text.heading }}>{label}</Text>
      {value ? (
        <Text className="text-sm font-medium" style={{ color: Colors.text.secondary }}>{value}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={danger ? Colors.text.danger : Colors.text.bodySoft} />
      )}
    </Pressable>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isGuest = isGuestUser();

  const [isPasswordSheetVisible, setIsPasswordSheetVisible] = useState(false);
  const [isDeleteSheetVisible, setIsDeleteSheetVisible] = useState(false);

  // Guard against double-tap opening multiple sheets
  const isNavigatingRef = useRef(false);

  const handleChangePassword = useCallback(async ({ currentPassword, newPassword }) => {
    await usersApi.changePassword({ currentPassword, newPassword });
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    try {
      await usersApi.deleteCurrentUser();
      clearAuthToken();
      setIsDeleteSheetVisible(false);
      router.replace("/auth/Login");
    } catch (error) {
      const message = error?.message || "Failed to delete account. Please try again.";
      Alert.alert("Error", message);
      throw error;
    }
  }, [router]);

  const openPasswordSheet = useCallback(() => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    setIsPasswordSheetVisible(true);
    // Reset guard after animation completes
    setTimeout(() => { isNavigatingRef.current = false; }, 300);
  }, []);

  const openDeleteSheet = useCallback(() => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    setIsDeleteSheetVisible(true);
    setTimeout(() => { isNavigatingRef.current = false; }, 300);
  }, []);



  return (
    <ProfileSubpageLayout title="Settings">
      <Text className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: Colors.text.secondary }}>Account &amp; Security</Text>
      <SettingsActionRow
        icon="lock-closed-outline"
        label="Change password"
        onPress={isGuest ? undefined : openPasswordSheet}
        disabled={isGuest}
      />

      <Text className="mb-2 mt-3 text-xs font-bold uppercase tracking-wide" style={{ color: Colors.text.secondary }}>Legal</Text>
      <SettingsActionRow
        icon="document-text-outline"
        label="Terms & Conditions"
        onPress={() => router.push("/legal/terms")}
      />
      <SettingsActionRow
        icon="shield-checkmark-outline"
        label="Privacy Notice"
        onPress={() => router.push("/legal/privacy")}
      />
      <SettingsActionRow
        icon="people-outline"
        label="Community Guidelines"
        onPress={() => router.push("/legal/community-guidelines")}
      />


      <Text className="mb-2 mt-3 text-xs font-bold uppercase tracking-wide" style={{ color: Colors.text.secondary }}>About</Text>
      <SettingsActionRow
        icon="information-circle-outline"
        label="App Version"
        value="1.0.0"
      />

      <Text className="mb-2 mt-3 text-xs font-bold uppercase tracking-wide" style={{ color: Colors.text.dangerLabel }}>Danger Zone</Text>
      <SettingsActionRow
        icon="trash-outline"
        label="Delete account"
        onPress={openDeleteSheet}
        danger
      />

      <ChangePasswordSheet
        visible={isPasswordSheetVisible}
        onCancel={() => setIsPasswordSheetVisible(false)}
        onSubmit={handleChangePassword}
        bottomInset={insets.bottom}
      />

      <DeleteAccountSheet
        visible={isDeleteSheetVisible}
        onCancel={() => setIsDeleteSheetVisible(false)}
        onConfirm={handleDeleteAccount}
        bottomInset={insets.bottom}
      />
    </ProfileSubpageLayout>
  );
}
