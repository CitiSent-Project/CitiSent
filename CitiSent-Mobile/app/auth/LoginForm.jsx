import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import {
  AuthActionButton,
  AuthBrandMark,
  AuthCityFooter,
  AuthInputField,
  RememberMeToggle,
  authApi,
  isEmptyIdentifier,
  parseLoginIdentifier,
} from "../../modules/auth";

export default function LoginFormScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    identifier: "",
    password: "",
  });

  const validateFields = () => {
    const nextErrors = {
      identifier: "",
      password: "",
    };

    if (isEmptyIdentifier(identifier)) {
      nextErrors.identifier = "Username or phone number is required.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    }

    setFieldErrors(nextErrors);
    return {
      isValid: !nextErrors.identifier && !nextErrors.password,
    };
  };

  const handleIdentifierChange = (value) => {
    setIdentifier(value);
    if (fieldErrors.identifier) {
      setFieldErrors((prev) => ({ ...prev, identifier: "" }));
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

    const { isValid } = validateFields();

    if (!isValid) {
      setErrorMessage("Please enter your username/phone number and password.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const parsedIdentifier = parseLoginIdentifier(identifier);

      await authApi.login({
        identifier: parsedIdentifier.raw,
        username: parsedIdentifier.username,
        phoneNumber: parsedIdentifier.phoneNumber,
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

      <AuthCityFooter />

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
              value={identifier}
              onChangeText={handleIdentifierChange}
              placeholder="Username or Phone Number"
              icon="person-outline"
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
              error={fieldErrors.identifier}
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

              <Pressable
                className="items-end"
                accessibilityRole="button"
                accessibilityLabel="Forgot password"
                onPress={() => router.push("/auth/ForgotPassword")}
              >
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
              onPress={() => router.push("/auth/CreateAccount")}
              accessibilityRole="button"
            >
              <Text className="text-[13px] text-[#8CA8C9]">Don&apos;t have an account? Sign up</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
