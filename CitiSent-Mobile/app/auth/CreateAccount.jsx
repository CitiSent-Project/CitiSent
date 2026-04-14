import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import {
  AuthActionButton,
  AuthBrandMark,
  AuthChoiceField,
  AuthCityFooter,
  AuthInputField,
  AuthSelectField,
  authApi,
} from "../../modules/auth";
import { RefreshableScrollView, usePullToRefresh } from "../../modules/shared";
import { fetchStoTomasBatangasBarangays } from "../../services/locationData";

const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

const CLIENT_TYPE_OPTIONS = [
  { label: "Business", value: "business" },
  { label: "Government", value: "government" },
  { label: "Citizen", value: "citizen" },
];

const FIXED_CITY = "Sto. Tomas";
const FIXED_PROVINCE = "Batangas";
const FIXED_COUNTRY = "Philippines";

const INITIAL_FIELD_ERRORS = {
  username: "",
  email: "",
  phoneNumber: "",
  age: "",
  gender: "",
  clientType: "",
  streetAddress: "",
  barangay: "",
  password: "",
  confirmPassword: "",
};

function mapRegisterErrorToFieldErrors(errorMessage) {
  const rawMessage = String(errorMessage || "").trim();
  const message = rawMessage.toLowerCase();
  const nextErrors = { ...INITIAL_FIELD_ERRORS };

  if (!rawMessage) {
    nextErrors.email = "Unable to create account right now. Please try again.";
    return nextErrors;
  }

  if (message.includes("username")) {
    nextErrors.username = rawMessage;
    return nextErrors;
  }

  if (message.includes("phone")) {
    nextErrors.phoneNumber = rawMessage;
    return nextErrors;
  }

  if (message.includes("email")) {
    nextErrors.email = rawMessage;
    return nextErrors;
  }

  if (message.includes("address") || message.includes("barangay")) {
    nextErrors.streetAddress = rawMessage;
    nextErrors.barangay = rawMessage;
    return nextErrors;
  }

  if (message.includes("password")) {
    nextErrors.password = rawMessage;
    return nextErrors;
  }

  if (message.includes("age")) {
    nextErrors.age = rawMessage;
    return nextErrors;
  }

  if (message.includes("gender")) {
    nextErrors.gender = rawMessage;
    return nextErrors;
  }

  if (message.includes("client type") || message.includes("client_type")) {
    nextErrors.clientType = rawMessage;
    return nextErrors;
  }

  nextErrors.email = rawMessage;
  return nextErrors;
}

function StaticAddressField({ label, value }) {
  return (
    <View className="mb-4 w-full">
      <Text className="mb-2 px-1 text-[13px] font-semibold text-[#CFDAEA]">{label}</Text>
      <View className="h-[48px] flex-row items-center rounded-full border border-[#6782A7] bg-[#263C61] px-4">
        <Text className="text-[15px] text-[#DDEBFF]">{value}</Text>
      </View>
    </View>
  );
}

export default function CreateAccountScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [clientType, setClientType] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [barangay, setBarangay] = useState("");
  const [barangayOptions, setBarangayOptions] = useState([]);
  const [isBarangayLoading, setIsBarangayLoading] = useState(true);
  const [barangayLoadError, setBarangayLoadError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    streetAddress: setStreetAddress,
    barangay: setBarangay,
    password: setPassword,
    confirmPassword: setConfirmPassword,
  };

  const barangaySelectOptions = useMemo(
    () => barangayOptions.map((name) => ({ label: name, value: name })),
    [barangayOptions],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadBarangays() {
      setIsBarangayLoading(true);
      setBarangayLoadError("");

      try {
        const nextBarangays = await fetchStoTomasBatangasBarangays();
        if (!isMounted) {
          return;
        }

        setBarangayOptions(nextBarangays);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setBarangayOptions([]);
        setBarangayLoadError(error?.message || "Unable to load barangays right now.");
      } finally {
        if (isMounted) {
          setIsBarangayLoading(false);
        }
      }
    }

    loadBarangays();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRetryBarangayLoad = async () => {
    setIsBarangayLoading(true);
    setBarangayLoadError("");

    try {
      const nextBarangays = await fetchStoTomasBatangasBarangays();
      setBarangayOptions(nextBarangays);
    } catch (error) {
      setBarangayOptions([]);
      setBarangayLoadError(error?.message || "Unable to load barangays right now.");
    } finally {
      setIsBarangayLoading(false);
    }
  };

  const validateFields = () => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhoneNumber = phoneNumber.replace(/\D/g, "");
    const trimmedStreetAddress = streetAddress.trim();
    const trimmedBarangay = barangay.trim();
    const composedAddress = `${trimmedStreetAddress}, ${trimmedBarangay}, ${FIXED_CITY}, ${FIXED_PROVINCE}, ${FIXED_COUNTRY}`;
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

    if (!trimmedStreetAddress) {
      nextErrors.streetAddress = "Street address is required.";
    } else if (trimmedStreetAddress.length < 5) {
      nextErrors.streetAddress = "Please enter a valid street address.";
    }

    if (!trimmedBarangay) {
      nextErrors.barangay = "Barangay is required.";
    } else if (!barangayOptions.includes(trimmedBarangay)) {
      nextErrors.barangay = "Please select a valid barangay.";
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
        !nextErrors.streetAddress &&
        !nextErrors.barangay &&
        !nextErrors.password &&
        !nextErrors.confirmPassword,
      trimmedUsername,
      trimmedEmail,
      trimmedPhoneNumber,
      composedAddress,
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
      composedAddress,
      parsedAge,
    } = validateFields();

    if (!isValid) {
      setSuccessMessage("");
      return;
    }

    setSuccessMessage("");
    setIsSubmitting(true);

    try {

      // Assign default profile image based on gender
      let profileImage = null;
      try {
        const { DEFAULT_PROFILE_IMAGES } = require("../../constants/profileImages");
        if (gender === "male") {
          profileImage = DEFAULT_PROFILE_IMAGES.male;
        } else if (gender === "female") {
          profileImage = DEFAULT_PROFILE_IMAGES.female;
        }
      } catch (e) {}

      await authApi.register({
        username: trimmedUsername,
        email: trimmedEmail,
        phoneNumber: trimmedPhoneNumber,
        age: parsedAge,
        gender,
        clientType,
        address: composedAddress,
        password,
        profileImage,
      });

      setSuccessMessage("Account created successfully! Please login to continue.");
      await new Promise((resolve) => setTimeout(resolve, 850));
      router.replace("/auth/LoginForm");
    } catch (error) {
      setSuccessMessage("");
      setFieldErrors(
        mapRegisterErrorToFieldErrors(
          error?.message || "Unable to create account right now. Please try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (field) => (value) => {
    const setFieldValue = fieldSetters[field];

    if (setFieldValue) {
      setFieldValue(value);
    }

    if (field === "barangay" && barangayLoadError) {
      setBarangayLoadError("");
    }

    setFieldErrors((prev) => ({
      ...prev,
      [field]: "",
    }));

    if (successMessage) {
      setSuccessMessage("");
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

            <AuthInputField
              value={streetAddress}
              onChangeText={handleFieldChange("streetAddress")}
              placeholder="Street Address"
              icon="location-outline"
              autoComplete="street-address"
              textContentType="fullStreetAddress"
              returnKeyType="next"
              error={fieldErrors.streetAddress}
            />

            <AuthSelectField
              label="Barangay"
              placeholder="Select barangay"
              value={barangay}
              options={barangaySelectOptions}
              onChange={handleFieldChange("barangay")}
              error={fieldErrors.barangay || barangayLoadError}
              loading={isBarangayLoading}
              disabled={isBarangayLoading || barangaySelectOptions.length === 0}
            />

            {barangayLoadError ? (
              <Pressable
                onPress={handleRetryBarangayLoad}
                className="mb-4 self-start rounded-full border border-[#D5E6FF] px-4 py-2"
                accessibilityRole="button"
                accessibilityLabel="Retry loading barangays"
              >
                <Text className="text-[12px] font-semibold text-[#CFDAEA]">Refresh and try again</Text>
              </Pressable>
            ) : null}

            <StaticAddressField label="City" value={FIXED_CITY} />
            <StaticAddressField label="Province" value={FIXED_PROVINCE} />
            <StaticAddressField label="Country" value={FIXED_COUNTRY} />

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
