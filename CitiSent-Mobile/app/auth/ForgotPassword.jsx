import { useState } from "react";
import { KeyboardAvoidingView, ScrollView, Platform, Pressable, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AuthActionButton,
  AuthBrandMark,
  AuthCityFooter,
  AuthInputField,
} from "../../modules/auth";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldError, setFieldError] = useState("");

  const handleEmailChange = (value) => {
    setEmail(value);

    if (fieldError) {
      setFieldError("");
    }

    if (errorMessage) {
      setErrorMessage("");
    }

    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const validateEmail = () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      return "Gmail address is required.";
    }

    if (!/^[^\s@]+@gmail\.com$/.test(trimmedEmail)) {
      return "Please enter a valid Gmail address.";
    }

    return "";
  };

  const handleSendResetLink = async () => {
    if (isSubmitting) {
      return;
    }

    const validationError = validateEmail();

    if (validationError) {
      setFieldError(validationError);
      setSuccessMessage("");
      setErrorMessage("Please enter the Gmail used when creating your account.");
      return;
    }

    setFieldError("");
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      setSuccessMessage("If this Gmail is registered, a password reset link has been sent.");
    } catch {
      setErrorMessage("Unable to process your request right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-[#1B2D4F]" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <StatusBar style="light" />

      <AuthCityFooter />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
      >
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
            <Text className="text-center text-[34px] text-[#CFDAEA]">Forgot Password?</Text>
            <Text className="mt-3 text-center text-[14px] leading-5 text-[#AFC5E2]">
              Enter the Gmail address used to create your account and we&apos;ll send a reset link.
            </Text>
          </View>

          <View className="mt-10">
            <AuthInputField
              value={email}
              onChangeText={handleEmailChange}
              placeholder="Gmail Address"
              icon="mail-outline"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="send"
              onSubmitEditing={handleSendResetLink}
              error={fieldError}
            />

            <AuthActionButton
              label={isSubmitting ? "Sending reset link..." : "Send Reset Link"}
              variant="primary"
              onPress={handleSendResetLink}
              disabled={isSubmitting}
            />

            {errorMessage ? (
              <Text className="mt-1 text-center text-[13px] text-[#FCA5A5]" accessibilityLiveRegion="polite">
                {errorMessage}
              </Text>
            ) : null}

            {successMessage ? (
              <Text className="mt-1 text-center text-[13px] text-[#86EFAC]" accessibilityLiveRegion="polite">
                {successMessage}
              </Text>
            ) : null}

            <Pressable
              className="mt-6 items-center"
              onPress={() => router.push("/auth/LoginForm")}
              accessibilityRole="button"
              accessibilityLabel="Back to login"
            >
              <Text className="text-[13px] text-[#8CA8C9]">Back to Login</Text>
            </Pressable>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}