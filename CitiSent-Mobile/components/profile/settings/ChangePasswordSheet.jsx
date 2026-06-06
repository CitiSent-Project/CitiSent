import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Colors } from "../../../modules/shared";

const MIN_PASSWORD_LENGTH = 8;

function PasswordField({ label, value, onChangeText, placeholder, editable }) {
  const [secureEntry, setSecureEntry] = useState(true);

  return (
    <View className="mb-4">
      <Text
        className="mb-1.5 text-sm font-semibold"
        style={{ color: Colors.text.fieldLabel }}
      >
        {label}
      </Text>
      <View
        className="flex-row items-center rounded-xl border px-3"
        style={{
          borderColor: Colors.borderSoft,
          backgroundColor: Colors.background,
        }}
      >
        <TextInput
          className="flex-1 py-3 text-base"
          style={{ color: Colors.text.primary }}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.secondary}
          secureTextEntry={secureEntry}
          autoCapitalize="none"
          autoCorrect={false}
          editable={editable}
        />
        <Pressable
          onPress={() => setSecureEntry((prev) => !prev)}
          className="ml-2 p-1"
          accessibilityRole="button"
          accessibilityLabel={secureEntry ? "Show password" : "Hide password"}
        >
          <Ionicons
            name={secureEntry ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={Colors.text.secondary}
          />
        </Pressable>
      </View>
    </View>
  );
}

function validatePasswords(currentPassword, newPassword, confirmPassword) {
  if (!currentPassword.trim()) {
    return "Please enter your current password.";
  }

  if (!newPassword) {
    return "Please enter a new password.";
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (newPassword !== confirmPassword) {
    return "New passwords do not match.";
  }

  if (currentPassword === newPassword) {
    return "New password must be different from your current password.";
  }

  return null;
}

export default function ChangePasswordSheet({
  visible,
  onCancel,
  onSubmit,
  bottomInset = 0,
}) {
  const translateY = useRef(new Animated.Value(500)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(visible);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      setIsSubmitting(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!shouldRender) {
      return;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 500,
        duration: 210,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 190,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setShouldRender(false);
      }
    });
  }, [backdropOpacity, shouldRender, translateY, visible]);

  if (!shouldRender) {
    return null;
  }

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    const validationError = validatePasswords(
      currentPassword,
      newPassword,
      confirmPassword,
    );

    if (validationError) {
      Alert.alert("Validation Error", validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({ currentPassword, newPassword });

      Alert.alert(
        "Password Changed",
        "Your password has been updated successfully.",
      );

      onCancel();
    } catch (error) {
      const message =
        error?.message || "Failed to change password. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={shouldRender}
      transparent
      animationType="none"
      onRequestClose={isSubmitting ? undefined : onCancel}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Animated.View
          className="absolute inset-0 bg-black"
          style={{
            opacity: backdropOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.35],
            }),
          }}
        >
          <Pressable
            className="h-full w-full"
            onPress={isSubmitting ? undefined : onCancel}
            accessibilityRole="button"
          />
        </Animated.View>

        <Animated.View
          className="rounded-t-[26px] bg-white px-5 pt-3"
          style={{
            transform: [{ translateY }],
            paddingBottom: Math.max(bottomInset, 16),
          }}
        >
          <View className="items-center pb-3">
            <View
              className="h-1 w-11 rounded-full"
              style={{ backgroundColor: Colors.border }}
            />
          </View>

          <View className="flex-row items-center pb-3">
            <Pressable
              onPress={isSubmitting ? undefined : onCancel}
              accessibilityRole="button"
              accessibilityLabel="Close change password"
              className="h-8 w-8 items-center justify-center"
            >
              <Ionicons name="close" size={24} color={Colors.text.primary} />
            </Pressable>

            <Text
              className="flex-1 text-center text-[24px] font-bold"
              style={{ color: Colors.text.primary }}
            >
              Change Password
            </Text>

            <View className="h-8 w-8" />
          </View>

          <View
            className="h-[1px]"
            style={{ backgroundColor: Colors.border }}
          />

          <View className="pt-5 pb-3">
            <PasswordField
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              editable={!isSubmitting}
            />
            <PasswordField
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="At least 8 characters"
              editable={!isSubmitting}
            />
            <PasswordField
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
              editable={!isSubmitting}
            />
          </View>

          <View className="flex-row items-center gap-3 pb-2">
            <Pressable
              className="flex-1 items-center rounded-full py-3"
              style={{ backgroundColor: Colors.ui.progressSoft }}
              onPress={isSubmitting ? undefined : onCancel}
              accessibilityRole="button"
              disabled={isSubmitting}
            >
              <Text
                className="text-[16px] font-semibold"
                style={{ color: Colors.primary }}
              >
                Cancel
              </Text>
            </Pressable>

            <Pressable
              className="flex-1 items-center rounded-full py-3"
              style={{
                backgroundColor: Colors.primary,
                opacity: isSubmitting ? 0.7 : 1,
              }}
              onPress={handleSubmit}
              accessibilityRole="button"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-[16px] font-semibold text-white">
                  Update Password
                </Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
