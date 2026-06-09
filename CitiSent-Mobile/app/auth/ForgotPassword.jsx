import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AuthActionButton,
  AuthBrandMark,
  AuthCityFooter,
  AuthInputField,
  authApi,
} from "../../modules/auth";
import { AppKeyboardAvoidingView, FeedbackModal } from "../../modules/shared";

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [modal, setModal] = useState({
    visible: false,
    type: "error",
    title: "",
    message: "",
  });

  const showModal = (type, title, message) =>
    setModal({ visible: true, type, title, message });
  const closeModal = () => setModal((prev) => ({ ...prev, visible: false }));

  const handleEmailChange = (value) => {
    setEmail(value);
    if (fieldError) setFieldError("");
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      setFieldError("Email address is required.");
      return;
    }

    if (!isValidEmail(trimmed)) {
      setFieldError("Please enter a valid email address.");
      return;
    }

    setFieldError("");
    setIsSubmitting(true);

    try {
      await authApi.requestOtp(trimmed);
      // Always navigate — do not reveal whether email exists
      router.push({ pathname: "/auth/OtpVerification", params: { email: trimmed } });
    } catch (error) {
      const msg = error?.message || "";
      if (msg.toLowerCase().includes("too many")) {
        showModal("error", "Too Many Requests", msg);
      } else {
        // Even on unexpected errors show a generic message (no enumeration)
        router.push({ pathname: "/auth/OtpVerification", params: { email: trimmed } });
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
            <View className="items-center">
              <AuthBrandMark />
            </View>

            <View className="mt-10">
              <Text className="text-center text-[32px] text-[#CFDAEA]">
                Forgot Password?
              </Text>
              <Text className="mt-3 text-center text-[14px] leading-5 text-[#AFC5E2]">
                Enter the email address linked to your account. We&apos;ll send
                you a 6-digit verification code.
              </Text>
            </View>

            <View className="mt-10">
              <AuthInputField
                value={email}
                onChangeText={handleEmailChange}
                placeholder="Email Address"
                icon="mail-outline"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="send"
                onSubmitEditing={handleSubmit}
                error={fieldError}
              />

              <AuthActionButton
                label={isSubmitting ? "Sending code…" : "Send Verification Code"}
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
                <Text className="text-[13px] text-[#8CA8C9] font-semibold">
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