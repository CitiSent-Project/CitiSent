import { Alert, Pressable, Text, View } from "react-native";
import { useCallback, useEffect, useState } from "react";
import { EditProfileTextField, ProfileSubpageLayout } from "../../modules/profile";
import { Colors, usePullToRefresh } from "../../modules/shared";
import { getAuthUser, setAuthUser } from "../../services/authSession";
import { api } from "../../services/api";

function asText(value) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "";
}

function asDigits(value) {
  return asText(value).replace(/\D/g, "");
}

function buildInitialProfile(sourceUser = getAuthUser()) {
  const authUser = sourceUser || {};
  const metadata = authUser.user_metadata || authUser.userMetadata || authUser.metadata || {};
  const profile = authUser.profile || {};

  return {
    fullName:
      asText(authUser.fullName) ||
      asText(authUser.name) ||
      asText(profile.fullName) ||
      asText(metadata.fullName) ||
      asText(metadata.name),
    username: asText(authUser.username) || asText(profile.username) || asText(metadata.username),
    email: asText(authUser.email) || asText(profile.email) || asText(metadata.email),
    phoneNumber:
      asDigits(authUser.phoneNumber || authUser.phone_number || authUser.phone) ||
      asDigits(profile.phoneNumber || profile.phone_number || profile.phone) ||
      asDigits(metadata.phoneNumber || metadata.phone_number || metadata.phone),
    address:
      asText(authUser.address) ||
      asText(profile.address) ||
      asText(metadata.address) ||
      asText(metadata.location),
    bio: asText(authUser.bio) || asText(profile.bio) || asText(metadata.bio),
    age: asDigits(authUser.age || profile.age || metadata.age),
  };
}

function unwrapCurrentUserPayload(response) {
  if (response && typeof response === "object") {
    if (response.data && typeof response.data === "object") {
      return response.data;
    }

    return response;
  }

  return null;
}

const INITIAL_PROFILE = buildInitialProfile(getAuthUser());

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EditProfilePage() {
  const [savedProfile, setSavedProfile] = useState(INITIAL_PROFILE);
  const [profileDraft, setProfileDraft] = useState(INITIAL_PROFILE);
  const [isSaving, setIsSaving] = useState(false);

  const syncProfileState = useCallback((user) => {
    const nextProfile = buildInitialProfile(user);
    setSavedProfile(nextProfile);
    setProfileDraft(nextProfile);
  }, []);

  const hydrateCurrentUserProfile = useCallback(async () => {
    try {
      const response = await api.get("/users/me");
      const currentUser = unwrapCurrentUserPayload(response);

      if (!currentUser || typeof currentUser !== "object") {
        return false;
      }

      setAuthUser(currentUser, {
        fallbackUsername: currentUser.username,
        fallbackPhoneNumber: currentUser.phoneNumber,
      });
      syncProfileState(currentUser);
      return true;
    } catch {
      return false;
    }
  }, [syncProfileState]);

  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    const didHydrate = await hydrateCurrentUserProfile();

    if (!didHydrate) {
      setProfileDraft(savedProfile);
    }
  });

  useEffect(() => {
    hydrateCurrentUserProfile();
  }, [hydrateCurrentUserProfile]);

  const setField = (field) => (value) => {
    setProfileDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const hasChanges = JSON.stringify(profileDraft) !== JSON.stringify(savedProfile);

  const validateProfile = () => {
    if (!profileDraft.fullName.trim()) {
      return "Full name is required.";
    }

    if (!profileDraft.username.trim()) {
      return "Username is required.";
    }

    if (!EMAIL_REGEX.test(profileDraft.email.trim())) {
      return "Please enter a valid email address.";
    }

    const normalizedPhone = profileDraft.phoneNumber.replace(/\D/g, "");
    if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
      return "Please enter a valid phone number.";
    }

    return "";
  };

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    const validationError = validateProfile();

    if (validationError) {
      Alert.alert("Invalid details", validationError);
      return;
    }

    if (!hasChanges) {
      Alert.alert("No changes", "Your profile details are already up to date.");
      return;
    }

    setIsSaving(true);

    setTimeout(() => {
      setSavedProfile(profileDraft);
      setIsSaving(false);
      Alert.alert("Profile updated", "Your profile details were saved successfully.");
    }, 350);
  };

  const handleReset = () => {
    setProfileDraft(savedProfile);
  };

  return (
    <ProfileSubpageLayout title="Edit Profile" refreshing={refreshing} onRefresh={onRefresh}>
      <View
        className="mb-4 rounded-2xl border px-4 py-4"
        style={{ borderColor: Colors.borderSoft, backgroundColor: Colors.background }}
      >
        <Text className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: Colors.text.secondary }}>
          Personal Information
        </Text>

        <EditProfileTextField
          label="Full Name"
          value={profileDraft.fullName}
          onChangeText={setField("fullName")}
          placeholder="e.g., Juan Dela Cruz"
          autoComplete="name"
          textContentType="name"
        />

        <EditProfileTextField
          label="Username"
          value={profileDraft.username}
          onChangeText={setField("username")}
          placeholder="e.g., juandelacruz"
          autoCapitalize="none"
          autoComplete="username"
          textContentType="username"
          helperText="Letters, numbers, and underscore only."
        />

        <EditProfileTextField
          label="Email"
          value={profileDraft.email}
          onChangeText={setField("email")}
          placeholder="e.g., juandelacruz@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />

        <EditProfileTextField
          label="Phone Number"
          value={profileDraft.phoneNumber}
          onChangeText={(value) => setField("phoneNumber")(value.replace(/\D/g, ""))}
          placeholder="e.g., 09123456789"
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          maxLength={15}
        />


        <EditProfileTextField
          label="Age"
          value={profileDraft.age}
          onChangeText={(value) => setField("age")(value.replace(/\D/g, ""))}
          placeholder="Enter your age"
          keyboardType="number-pad"
          autoComplete="off"
          textContentType="none"
          maxLength={3}
        />

        <EditProfileTextField
          label="Address"
          value={profileDraft.address}
          onChangeText={setField("address")}
          placeholder="e.g., Sto. Tomas, Batangas"
          autoComplete="street-address"
          textContentType="fullStreetAddress"
        />
      </View>

      <View className="mb-2 flex-row gap-2">
        <Pressable
          onPress={handleReset}
          accessibilityRole="button"
          disabled={isSaving || !hasChanges}
          className="flex-1 items-center rounded-2xl border px-4 py-3"
          style={{
            borderColor: Colors.borderMuted,
            backgroundColor: isSaving || !hasChanges ? Colors.ui.neutralMuted : Colors.surface,
          }}
        >
          <Text
            className="text-sm font-bold"
            style={{ color: isSaving || !hasChanges ? Colors.text.secondary : Colors.text.body }}
          >
            Reset
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSave}
          accessibilityRole="button"
          disabled={isSaving}
          className="flex-1 items-center rounded-2xl px-4 py-3"
          style={{ backgroundColor: Colors.primaryStrong }}
        >
          <Text className="text-sm font-bold" style={{ color: Colors.text.inverse }}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Text>
        </Pressable>
      </View>
    </ProfileSubpageLayout>
  );
}