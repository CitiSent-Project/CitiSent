import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import {
  AuthActionButton,
  AuthBrandMark,
  AuthChoiceField,
  AuthCityFooter,
  AuthInputField,
  authApi,
} from "../../modules/auth";
import { RefreshableScrollView, usePullToRefresh } from "../../modules/shared";

const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

const CLIENT_TYPE_OPTIONS = [
  { label: "Business", value: "business" },
  { label: "Government", value: "government" },
  { label: "Citizen", value: "citizen" },
];

const INITIAL_FIELD_ERRORS = {
  username: "",
  email: "",
  phoneNumber: "",
  age: "",
  gender: "",
  clientType: "",
  password: "",
  confirmPassword: "",
};

export default function CreateAccountScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [clientType, setClientType] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { refreshing, onRefresh } = usePullToRefresh();
  const [fieldErrors, setFieldErrors] = useState(INITIAL_FIELD_ERRORS);

  const fieldSetters = {
    username: setUsername,
    email: setEmail,
    phoneNumber: setPhoneNumber,
    age: setAge,
    gender: setGender,
    clientType: setClientType,
    password: setPassword,
    confirmPassword: setConfirmPassword,
  };

  const validateFields = () => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhoneNumber = phoneNumber.replace(/\D/g, "");
    const parsedAge = Number.parseInt(age.trim(), 10);
    const nextErrors = { ...INITIAL_FIELD_ERRORS };

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

    if (!trimmedPhoneNumber) {
      nextErrors.phoneNumber = "Phone number is required.";
    } else if (trimmedPhoneNumber.length < 10 || trimmedPhoneNumber.length > 15) {
      nextErrors.phoneNumber = "Please enter a valid phone number.";
    }

    if (!age.trim()) {
      nextErrors.age = "Age is required.";
    } else if (!Number.isInteger(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      nextErrors.age = "Please enter a valid age.";
    }

    if (!gender) {
      nextErrors.gender = "Gender is required.";
    }

    if (!clientType) {
      nextErrors.clientType = "Client type is required.";
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
        !nextErrors.phoneNumber &&
        !nextErrors.age &&
        !nextErrors.gender &&
        !nextErrors.clientType &&
        !nextErrors.password &&
        !nextErrors.confirmPassword,
      trimmedUsername,
      trimmedEmail,
      trimmedPhoneNumber,
      parsedAge,
    };
  };

  const handleCreateAccount = async () => {
    if (isSubmitting) {
      return;
    }

    const {
      isValid,
      trimmedUsername,
      trimmedEmail,
      trimmedPhoneNumber,
      parsedAge,
    } = validateFields();

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
        phoneNumber: trimmedPhoneNumber,
        age: parsedAge,
        gender,
        clientType,
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
    const setFieldValue = fieldSetters[field];

    if (setFieldValue) {
      setFieldValue(value);
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

      <AuthCityFooter />

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
            <Text className="mt-8 text-[34px] text-[#CFDAEA]">Create Account!</Text>
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
              value={phoneNumber}
              onChangeText={(value) => handleFieldChange("phoneNumber")(value.replace(/\D/g, ""))}
              placeholder="Phone Number"
              icon="call-outline"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              returnKeyType="next"
              error={fieldErrors.phoneNumber}
            />

            <AuthInputField
              value={age}
              onChangeText={(value) => handleFieldChange("age")(value.replace(/\D/g, ""))}
              placeholder="Age"
              icon="calendar-outline"
              keyboardType="number-pad"
              returnKeyType="next"
              error={fieldErrors.age}
            />

            <AuthChoiceField
              label="Gender"
              options={GENDER_OPTIONS}
              value={gender}
              onChange={handleFieldChange("gender")}
              error={fieldErrors.gender}
            />

            <AuthChoiceField
              label="Client Type"
              options={CLIENT_TYPE_OPTIONS}
              value={clientType}
              onChange={handleFieldChange("clientType")}
              error={fieldErrors.clientType}
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

            <Pressable className="mt-6 items-center" onPress={() => router.push("/auth/LoginForm")} accessibilityRole="button">
              <Text className="text-[13px] text-[#8CA8C9]">Already have an account? Login</Text>
            </Pressable>
          </View>
        </RefreshableScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
