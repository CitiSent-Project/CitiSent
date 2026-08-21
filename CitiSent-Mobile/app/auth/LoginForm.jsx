import { useState } from "react";
import { ScrollView, Pressable, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import {
  AuthActionButton,
  AuthAlertCard,
  AuthBrandMark,
  AuthCityFooter,
  AuthInputField,
  authApi,
  parseLoginIdentifier,
} from "../../modules/auth";
import { validateLoginFields, getLoginErrorMessage } from "../../utils/authValidation";
import { AppKeyboardAvoidingView } from "../../modules/shared";
import { createLoginPerformance } from "../../services/loginPerformance";

export default function LoginFormScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    identifier: "",
    password: "",
  });

  const validateFields = () => {
    const { errors, isValid } = validateLoginFields(identifier, password);
    setFieldErrors(errors);
    return { isValid };
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
      // Local field errors are shown directly on the inputs, no global error needed.
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);
    const performance = createLoginPerformance();
    performance.mark("requestStarted");

    try {
      const parsedIdentifier = parseLoginIdentifier(identifier.trim());

      await authApi.login({
        identifier: parsedIdentifier.raw,
        username: parsedIdentifier.username,
        phoneNumber: parsedIdentifier.phoneNumber,
        password,
      });
      performance.mark("authenticationCompleted");
      performance.mark("sessionObtained");
      router.replace("/(tabs)");
      performance.mark("navigationCompleted");
      performance.finish();
    } catch (error) {
      const apiMessage = error?.response?.data?.message || error?.message || "";
      const raw = getLoginErrorMessage(error);
      
      const textToMatch = `${apiMessage} ${raw}`.toLowerCase();
      
      if (textToMatch.includes("username or phone number")) {
        setFieldErrors((prev) => ({ ...prev, identifier: "Incorrect username or phone number. Please try again." }));
      } else if (textToMatch.includes("incorrect password") || textToMatch.includes("invalid password") || textToMatch.includes("invalid credentials")) {
        setFieldErrors((prev) => ({ ...prev, password: "Incorrect password. Please try again." }));
      } else {
        setErrorMessage(
          raw.toLowerCase().includes("please try again") ? raw : `${raw} Please try again.`,
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-[#1B2D4F]">
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

            <View className="mb-6 flex-row items-center justify-end">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Forgot password"
                onPress={() => router.push("/auth/ForgotPassword")}
              >
                <Text className="text-[14px] text-[#8CA8C9] font-semibold">Forgot your Password?</Text>
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

            <AuthAlertCard variant="error" message={errorMessage} />

            <Pressable
              className="mt-4 items-center"
              onPress={() => router.push("/auth/CreateAccount")}
              accessibilityRole="button"
            >
              <Text className="text-[13px] text-[#8CA8C9] font-semibold">Don&apos;t have an account? Sign up</Text>
            </Pressable>
          </View>
        </View>
        </ScrollView>
      </AppKeyboardAvoidingView>
    </View>
  );
}
