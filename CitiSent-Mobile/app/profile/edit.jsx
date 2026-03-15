import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, Text, View } from "react-native";
import { useState } from "react";
import { EditProfileTextField, ProfileSubpageLayout } from "../../modules/profile";
import { Colors, usePullToRefresh } from "../../modules/shared";

const INITIAL_PROFILE = {
  fullName: "Juan Dela Cruz",
  username: "juandelacruz",
  email: "juandelacruz@email.com",
  phoneNumber: "09123456789",
  address: "Sto. Tomas, Batangas",
  bio: "Concerned citizen helping keep our community safe.",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EditProfilePage() {
  const [savedProfile, setSavedProfile] = useState(INITIAL_PROFILE);
  const [profileDraft, setProfileDraft] = useState(INITIAL_PROFILE);
  const [isSaving, setIsSaving] = useState(false);

  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    setProfileDraft(savedProfile);
  });

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
        <Text className="text-xs font-bold uppercase tracking-wide" style={{ color: Colors.text.secondary }}>
          Profile Photo
        </Text>

        <View className="items-center pb-2 pt-4">
          <Pressable
            onPress={() => Alert.alert("Coming soon", "Photo upload will be available in a future update.")}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            className="h-[84px] w-[84px] items-center justify-center rounded-full"
            style={{
              backgroundColor: Colors.ui.profileAvatarSoft,
              borderWidth: 1,
              borderColor: Colors.ui.headerDark,
            }}
          >
            <Ionicons name="person" size={44} color={Colors.text.secondary} />

            <View
              className="absolute bottom-0 right-0 h-7 w-7 items-center justify-center rounded-full"
              style={{
                backgroundColor: Colors.primary,
                borderWidth: 1,
                borderColor: Colors.surface,
              }}
            >
              <Ionicons name="create-outline" size={14} color={Colors.text.inverse} />
            </View>
          </Pressable>

          <Text className="mt-3 text-xs" style={{ color: Colors.text.secondary }}>
            Tap photo to update
          </Text>
        </View>
      </View>

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
          placeholder="Enter your full name"
          autoComplete="name"
          textContentType="name"
        />

        <EditProfileTextField
          label="Username"
          value={profileDraft.username}
          onChangeText={setField("username")}
          placeholder="Enter your username"
          autoCapitalize="none"
          autoComplete="username"
          textContentType="username"
          helperText="Letters, numbers, and underscore only."
        />

        <EditProfileTextField
          label="Email"
          value={profileDraft.email}
          onChangeText={setField("email")}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />

        <EditProfileTextField
          label="Phone Number"
          value={profileDraft.phoneNumber}
          onChangeText={(value) => setField("phoneNumber")(value.replace(/\D/g, ""))}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          maxLength={15}
        />

        {/* <EditProfileTextField
          label="Age"
          value={profileDraft.age}
            onChangeText={(value) => setField("age")(value.replace(/\D/g, ""))}
            placeholder="Enter your age"
            keyboardType="number-pad"
            autoComplete="off"
            textContentType="none"
            maxLength={3}
        /> */}

        <EditProfileTextField
          label="Address"
          value={profileDraft.address}
          onChangeText={setField("address")}
          placeholder="Enter your address"
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