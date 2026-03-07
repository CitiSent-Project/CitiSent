import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import AuthActionButton from "../components/auth/AuthActionButton";
import AuthBrandMark from "../components/auth/AuthBrandMark";
import AuthCityFooter from "../components/auth/AuthCityFooter";
import AuthInputField from "../components/auth/AuthInputField";
import RememberMeToggle from "../components/auth/RememberMeToggle";
import { authApi } from "../services/auth";

export default function LoginFormScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    username: "",
    password: "",
  });

  const validateFields = () => {
    const nextErrors = {
      username: "",
      password: "",
    };

    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      nextErrors.username = "Username is required.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    }

    setFieldErrors(nextErrors);
    return {
      isValid: !nextErrors.username && !nextErrors.password,
      trimmedUsername,
    };
  };

  const handleUsernameChange = (value) => {
    setUsername(value);
    if (fieldErrors.username) {
      setFieldErrors((prev) => ({ ...prev, username: "" }));
    }
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: "" }));
    }
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleLogin = async () => {
    if (isSubmitting) {
      return;
    }

    const { isValid, trimmedUsername } = validateFields();

    if (!isValid) {
      setErrorMessage("Please enter your username and password.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await authApi.login({
        username: trimmedUsername,
        password,
        rememberMe,
      });
      router.replace("/(tabs)");
    } catch (error) {
      setErrorMessage(error?.message || "Unable to login right now. Please try again.");
    } finally {
      setIsSubmitting(false);
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
        <View className="flex-1 px-8 pt-16">
          <View className="items-center">
            <AuthBrandMark />
          </View>

          <View className="items-center">
            <Text className="mt-10 text-[36px] text-[#CFDAEA]">Welcome back!</Text>
          </View>

          <View className="mt-12">
            <AuthInputField
              value={username}
              onChangeText={handleUsernameChange}
              placeholder="Username"
              icon="person-outline"
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
              error={fieldErrors.username}
            />

            <AuthInputField
              value={password}
              onChangeText={handlePasswordChange}
              placeholder="Password"
              icon="lock-closed-outline"
              secureTextEntry={!showPassword}
              showPasswordToggle
              passwordVisible={showPassword}
              onTogglePassword={() => setShowPassword((prev) => !prev)}
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleLogin}
              error={fieldErrors.password}
            />

            <View className="mb-6 flex-row items-center justify-between">
              <RememberMeToggle checked={rememberMe} onToggle={() => setRememberMe((prev) => !prev)} />

              <Pressable className="items-end" accessibilityRole="button">
                <Text className="text-[14px] text-[#8CA8C9]">Forgot your Password?</Text>
              </Pressable>
            </View>

            <View>
              <AuthActionButton
                label={isSubmitting ? "Logging in..." : "Login"}
                variant="primary"
                onPress={handleLogin}
                disabled={isSubmitting}
              />
            </View>

            {errorMessage ? (
              <Text className="mt-1 text-center text-[13px] text-[#FCA5A5]">{errorMessage}</Text>
            ) : null}

            <Pressable
              className="mt-4 items-center"
              onPress={() => router.push("/create-account")}
              accessibilityRole="button"
            >
              <Text className="text-[13px] text-[#8CA8C9]">Don&apos;t have an account? Sign up</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <AuthCityFooter />
    </View>
  );
}
