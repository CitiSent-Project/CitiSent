import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import AuthActionButton from "../components/auth/AuthActionButton";
import AuthBrandMark from "../components/auth/AuthBrandMark";
import AuthCityFooter from "../components/auth/AuthCityFooter";
import AuthInputField from "../components/auth/AuthInputField";
import RefreshableScrollView from "../components/ui/RefreshableScrollView";
import usePullToRefresh from "../hooks/usePullToRefresh";
import { authApi } from "../services/auth";

export default function CreateAccountScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { refreshing, onRefresh } = usePullToRefresh();
  const [fieldErrors, setFieldErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const validateFields = () => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const nextErrors = {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    };

    if (!trimmedUsername) {
      nextErrors.username = "Username is required.";
    } else if (trimmedUsername.length < 3) {
      nextErrors.username = "Username must be at least 3 characters.";
    } else if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      nextErrors.username = "Use only letters, numbers, and underscore (_).";
    }

    if (!trimmedEmail) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    } else if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      nextErrors.password = "Use at least one letter and one number.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(nextErrors);

    return {
      isValid:
        !nextErrors.username &&
        !nextErrors.email &&
        !nextErrors.password &&
        !nextErrors.confirmPassword,
      trimmedUsername,
      trimmedEmail,
    };
  };

  const handleCreateAccount = async () => {
    if (isSubmitting) {
      return;
    }

    const { isValid, trimmedUsername, trimmedEmail } = validateFields();

    if (!isValid) {
      setSuccessMessage("");
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    setSuccessMessage("");
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await authApi.register({
        username: trimmedUsername,
        email: trimmedEmail,
        password,
      });

      setSuccessMessage("Account created successfully! Redirecting...");
      await new Promise((resolve) => setTimeout(resolve, 850));
      router.replace("/(tabs)");
    } catch (error) {
      setSuccessMessage("");
      setErrorMessage(error?.message || "Unable to create account right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (field) => (value) => {
    if (field === "username") {
      setUsername(value);
    } else if (field === "email") {
      setEmail(value);
    } else if (field === "password") {
      setPassword(value);
    } else if (field === "confirmPassword") {
      setConfirmPassword(value);
    }

    setFieldErrors((prev) => ({
      ...prev,
      [field]: "",
    }));

    if (successMessage) {
      setSuccessMessage("");
    }

    if (errorMessage) {
      setErrorMessage("");
    }
  };

  return (
    <View className="flex-1 bg-[#1B2D4F]">
      <StatusBar style="light" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={24}
      >
        <RefreshableScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-8 pb-44 pt-16"
          keyboardShouldPersistTaps="handled"
          refreshing={refreshing}
          onRefresh={onRefresh}
        >
          <View className="items-center">
            <AuthBrandMark />
            <Text className="mt-8 text-[34px] text-[#CFDAEA]">Create account</Text>
          </View>

          <View className="mt-10">
            <AuthInputField
              value={username}
              onChangeText={handleFieldChange("username")}
              placeholder="Username"
              icon="person-outline"
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
              error={fieldErrors.username}
            />

            <AuthInputField
              value={email}
              onChangeText={handleFieldChange("email")}
              placeholder="Email"
              icon="mail-outline"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              error={fieldErrors.email}
            />

            <AuthInputField
              value={password}
              onChangeText={handleFieldChange("password")}
              placeholder="Password"
              icon="lock-closed-outline"
              secureTextEntry={!showPassword}
              showPasswordToggle
              passwordVisible={showPassword}
              onTogglePassword={() => setShowPassword((prev) => !prev)}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              error={fieldErrors.password}
            />

            <AuthInputField
              value={confirmPassword}
              onChangeText={handleFieldChange("confirmPassword")}
              placeholder="Confirm Password"
              icon="shield-checkmark-outline"
              secureTextEntry={!showConfirmPassword}
              showPasswordToggle
              passwordVisible={showConfirmPassword}
              onTogglePassword={() => setShowConfirmPassword((prev) => !prev)}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={handleCreateAccount}
              error={fieldErrors.confirmPassword}
            />

            <AuthActionButton
              label={isSubmitting ? "Creating account..." : "Create Account"}
              variant="primary"
              onPress={handleCreateAccount}
              disabled={isSubmitting}
            />

            {errorMessage ? (
              <Text className="mt-1 text-center text-[13px] text-[#FCA5A5]">{errorMessage}</Text>
            ) : null}

            {successMessage ? (
              <Text className="mt-1 text-center text-[13px] text-[#86EFAC]">{successMessage}</Text>
            ) : null}

            <Pressable className="mt-6 items-center" onPress={() => router.push("/login-form")} accessibilityRole="button">
              <Text className="text-[13px] text-[#8CA8C9]">Already have an account? Login</Text>
            </Pressable>
          </View>
        </RefreshableScrollView>
      </KeyboardAvoidingView>

      <AuthCityFooter />
    </View>
  );
}
