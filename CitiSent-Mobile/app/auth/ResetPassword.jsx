import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AuthActionButton,
  AuthBrandMark,
  AuthCityFooter,
  AuthInputField,
  authApi,
} from "../../modules/auth";
import { AppKeyboardAvoidingView, FeedbackModal } from "../../modules/shared";

// Password requirements — must match the backend (min 8, max 128)
const PASSWORD_MIN = 8;

function validatePasswords(password, confirmPassword) {
  const errors = [];

  if (!password) {
    errors.push("New password is required.");
  } else if (password.length < PASSWORD_MIN) {
    errors.push(`Password must be at least ${PASSWORD_MIN} characters.`);
  } else if (password.length > 128) {
    errors.push("Password must not exceed 128 characters.");
  }

  if (!confirmPassword) {
    errors.push("Please confirm your new password.");
  } else if (password && confirmPassword !== password) {
    errors.push("Passwords do not match.");
  }

  return errors;
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { resetToken } = useLocalSearchParams();
  const token = Array.isArray(resetToken) ? resetToken[0] : resetToken || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState({
    visible: false,
    type: "error",
    title: "",
    message: "",
    onCloseAction: null,
  });

  const showModal = (type, title, message, onCloseAction = null) =>
    setModal({ visible: true, type, title, message, onCloseAction });

  const closeModal = () => {
    const action = modal.onCloseAction;
    setModal((prev) => ({ ...prev, visible: false }));
    if (action) action();
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (validationErrors.length) setValidationErrors([]);
  };

  const handleConfirmChange = (value) => {
    setConfirmPassword(value);
    if (validationErrors.length) setValidationErrors([]);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Show ALL validation errors at once
    const errors = validatePasswords(password, confirmPassword);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (!token) {
      showModal(
        "error",
        "Session Error",
        "Your reset session is missing. Please start over from Forgot Password.",
      );
      return;
    }

    setValidationErrors([]);
    setIsSubmitting(true);

    try {
      await authApi.resetPasswordWithOtp(token, password);

      showModal(
        "success",
        "Password Reset!",
        "Your password has been updated successfully. You can now log in with your new password.",
        () => {
          router.replace("/auth/LoginForm");
        },
      );
    } catch (err) {
      const msg = err?.message || "Unable to reset password. Please try again.";

      if (
        msg.toLowerCase().includes("expired") ||
        msg.toLowerCase().includes("invalid reset")
      ) {
        showModal("error", "Session Expired", `${msg}\n\nPlease go back and request a new code.`);
      } else {
        showModal("error", "Reset Failed", msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View
      className="flex-1 bg-[#1B2D4F]"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <StatusBar style="light" />

      <AuthCityFooter />

      <AppKeyboardAvoidingView className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-8 pt-16">
            {/* Brand */}
            <View className="items-center">
              <AuthBrandMark />
            </View>

            {/* Heading */}
            <View className="mt-10">
              <Text className="text-center text-[32px] text-[#CFDAEA]">
                Reset Password
              </Text>
              <Text className="mt-3 text-center text-[14px] leading-5 text-[#AFC5E2]">
                Choose a strong new password for your account.
              </Text>
            </View>

            {/* Password requirements hint */}
            <View className="mt-6 rounded-xl border border-[#2A4A70] bg-[#162540] px-4 py-3">
              <Text className="text-[12px] text-[#8CA8C9]">
                • At least {PASSWORD_MIN} characters{"\n"}
                • Mix of letters, numbers, and symbols recommended
              </Text>
            </View>

            {/* Form */}
            <View className="mt-6">
              <AuthInputField
                value={password}
                onChangeText={handlePasswordChange}
                placeholder="New Password"
                icon="lock-closed-outline"
                secureTextEntry={!showPassword}
                showPasswordToggle
                passwordVisible={showPassword}
                onTogglePassword={() => setShowPassword((prev) => !prev)}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
              />

              <AuthInputField
                value={confirmPassword}
                onChangeText={handleConfirmChange}
                placeholder="Confirm New Password"
                icon="lock-closed-outline"
                secureTextEntry={!showConfirm}
                showPasswordToggle
                passwordVisible={showConfirm}
                onTogglePassword={() => setShowConfirm((prev) => !prev)}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />

              {/* All validation errors displayed at once */}
              {validationErrors.length > 0 ? (
                <View className="mb-4 rounded-lg bg-[#2D1010] px-4 py-3">
                  {validationErrors.map((err, i) => (
                    <Text
                      key={i}
                      className="text-[13px] text-[#FCA5A5]"
                      accessibilityLiveRegion="polite"
                    >
                      • {err}
                    </Text>
                  ))}
                </View>
              ) : null}

              <AuthActionButton
                label={isSubmitting ? "Resetting…" : "Reset Password"}
                variant="primary"
                onPress={handleSubmit}
                disabled={isSubmitting}
              />

              <Pressable
                className="mt-6 items-center"
                onPress={() => router.push("/auth/LoginForm")}
                accessibilityRole="button"
                accessibilityLabel="Back to login"
              >
                <Text className="text-[13px] text-[#8CA8C9]">
                  Back to Login
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </AppKeyboardAvoidingView>

      <FeedbackModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />
    </View>
  );
}
