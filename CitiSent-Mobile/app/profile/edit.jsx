import { Pressable, Text, View, ActivityIndicator } from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  EditProfileTextField,
  BarangaySelectField,
  ProfileSubpageLayout,
} from "../../modules/profile";
import { Colors, FeedbackModal, SkeletonBlock, usePullToRefresh } from "../../modules/shared";
import { getAuthUser, setAuthUser } from "../../services/authSession";
import { api } from "../../services/api";
import { fetchStoTomasBatangasBarangays } from "../../services/locationData";

// ─── Helpers ────────────────────────────────────────────────────────────────────

function asText(value) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function asDigits(value) {
  return asText(value).replace(/\D/g, "");
}

function parsePhoneNumberToLocal(phone) {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("639") && digits.length === 12) {
    return digits.slice(2);
  }
  if (digits.startsWith("09") && digits.length === 11) {
    return digits.slice(1);
  }
  if (digits.startsWith("9") && digits.length === 10) {
    return digits;
  }
  return digits.slice(-10);
}

function splitFullName(fullName) {
  const trimmed = asText(fullName).trim();
  if (!trimmed) return { fname: "", mname: "", lname: "" };

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { fname: parts[0], mname: "", lname: "" };
  if (parts.length === 2) return { fname: parts[0], mname: "", lname: parts[1] };

  return {
    fname: parts[0],
    mname: parts.slice(1, -1).join(" "),
    lname: parts[parts.length - 1],
  };
}

function buildInitialProfile(sourceUser = getAuthUser()) {
  const authUser = sourceUser || {};
  const metadata = authUser.user_metadata || authUser.userMetadata || authUser.metadata || {};
  const profile = authUser.profile || {};
  const fullNameCandidate =
    asText(authUser.fullName) || asText(authUser.name) || asText(profile.fullName) ||
    asText(metadata.fullName) || asText(metadata.name);
  const fallbackParts = splitFullName(fullNameCandidate);

  return {
    fname: asText(authUser.fname) || asText(profile.fname) || asText(metadata.fname) || fallbackParts.fname,
    mname: asText(authUser.mname) || asText(profile.mname) || asText(metadata.mname) || fallbackParts.mname,
    lname: asText(authUser.lname) || asText(profile.lname) || asText(metadata.lname) || fallbackParts.lname,
    username: asText(authUser.username) || asText(profile.username) || asText(metadata.username),
    email: asText(authUser.email) || asText(profile.email) || asText(metadata.email),
    phoneNumber: parsePhoneNumberToLocal(
      authUser.phoneNumber || authUser.phone_number || authUser.phone ||
      profile.phoneNumber || profile.phone_number || profile.phone ||
      metadata.phoneNumber || metadata.phone_number || metadata.phone
    ),
    age: asDigits(authUser.age || profile.age || metadata.age),
    barangay: asText(authUser.barangay) || asText(profile.barangay) || asText(metadata.barangay),
    city: asText(authUser.city) || asText(profile.city) || asText(metadata.city) || "Sto. Tomas",
    province: asText(authUser.province) || asText(profile.province) || asText(metadata.province) || "Batangas",
  };
}

function unwrapCurrentUserPayload(response) {
  if (response && typeof response === "object") {
    if (response.data && typeof response.data === "object") return response.data;
    return response;
  }
  return null;
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

const INITIAL_FIELD_ERRORS = {
  fname: "",
  lname: "",
  username: "",
  email: "",
  phoneNumber: "",
  age: "",
  barangay: "",
};

const FIXED_CITY = "Sto. Tomas";
const FIXED_PROVINCE = "Batangas";

// ─── Duplicate / server error → field error mapping ─────────────────────────────

/**
 * Maps a backend 409 Conflict error message to the appropriate field.
 * The backend sends exact messages like:
 *   "This username is already in use. Please choose a different username."
 *   "This email address is already registered to another account."
 *   "This phone number is already associated with another account."
 */
function mapServerErrorToFieldErrors(errorMessage) {
  const raw = String(errorMessage || "").trim();
  const lower = raw.toLowerCase();
  const nextErrors = { ...INITIAL_FIELD_ERRORS };

  if (lower.includes("username")) {
    nextErrors.username = raw;
  } else if (lower.includes("email")) {
    nextErrors.email = raw;
  } else if (lower.includes("phone")) {
    nextErrors.phoneNumber = raw;
  } else {
    // Unknown conflict field — surface on username as a safe default
    nextErrors.username = raw || "A field value is already in use by another account.";
  }

  return nextErrors;
}

function hasAnyFieldError(errors) {
  return Object.values(errors).some(Boolean);
}

// ─── Skeleton ───────────────────────────────────────────────────────────────────

function FieldSkeleton() {
  return (
    <View className="mb-4">
      <SkeletonBlock className="mb-2 h-4 w-24 rounded-md" />
      <SkeletonBlock className="h-[52px] w-full rounded-2xl" />
    </View>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function EditProfilePage() {
  const [savedProfile, setSavedProfile] = useState(() => buildInitialProfile(getAuthUser()));
  const [profileDraft, setProfileDraft] = useState(() => buildInitialProfile(getAuthUser()));
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState(INITIAL_FIELD_ERRORS);

  // Feedback modal state
  const [modal, setModal] = useState({ visible: false, title: "", message: "", type: "info" });

  // Barangay dropdown state — same approach as CreateAccount
  const [barangayOptions, setBarangayOptions] = useState([]);
  const [isBarangayLoading, setIsBarangayLoading] = useState(true);
  const [barangayLoadError, setBarangayLoadError] = useState("");

  const barangayNames = useMemo(
    () => barangayOptions.map((name) => name),
    [barangayOptions],
  );

  // ─── Barangay loading ───────────────────────────────────────────────────────

  const loadBarangays = useCallback(async () => {
    setIsBarangayLoading(true);
    setBarangayLoadError("");
    try {
      const data = await fetchStoTomasBatangasBarangays();
      setBarangayOptions(data);
    } catch (err) {
      setBarangayOptions([]);
      setBarangayLoadError(err?.message || "Unable to load barangays right now.");
    } finally {
      setIsBarangayLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBarangays();
  }, [loadBarangays]);

  // ─── Profile hydration ─────────────────────────────────────────────────────

  const syncProfileState = useCallback((user) => {
    const nextProfile = buildInitialProfile(user);
    setSavedProfile(nextProfile);
    setProfileDraft(nextProfile);
  }, []);

  const hydrateCurrentUserProfile = useCallback(async () => {
    try {
      const response = await api.get("/users/me");
      const currentUser = unwrapCurrentUserPayload(response);
      if (!currentUser || typeof currentUser !== "object") return false;

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
    if (!didHydrate) setProfileDraft(savedProfile);
  });

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    hydrateCurrentUserProfile().finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [hydrateCurrentUserProfile]);

  // ─── Field change ──────────────────────────────────────────────────────────

  const setField = (field) => (value) => {
    setProfileDraft((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user starts editing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const hasChanges = JSON.stringify(profileDraft) !== JSON.stringify(savedProfile);

  // ─── All-at-once validation ────────────────────────────────────────────────

  const validateProfile = () => {
    const nextErrors = { ...INITIAL_FIELD_ERRORS };

    if (!profileDraft.fname.trim()) {
      nextErrors.fname = "First name is required.";
    }

    if (!profileDraft.lname.trim()) {
      nextErrors.lname = "Last name is required.";
    }

    const trimmedUsername = profileDraft.username.trim();
    if (!trimmedUsername) {
      nextErrors.username = "Username is required.";
    } else if (trimmedUsername.length < 3) {
      nextErrors.username = "Username must be at least 3 characters.";
    } else if (!USERNAME_REGEX.test(trimmedUsername)) {
      nextErrors.username = "Use only letters, numbers, and underscore (_).";
    }

    const trimmedEmail = profileDraft.email.trim();
    if (!trimmedEmail) {
      nextErrors.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    const normalizedPhone = profileDraft.phoneNumber.replace(/\D/g, "");
    if (!normalizedPhone) {
      nextErrors.phoneNumber = "Phone number is required.";
    } else if (!normalizedPhone.startsWith("9")) {
      nextErrors.phoneNumber = "Phone number must start with 9 after the +63 prefix.";
    } else if (normalizedPhone.length !== 10) {
      nextErrors.phoneNumber = "Phone number must be exactly 10 digits after +63.";
    }

    if (profileDraft.age) {
      const ageNum = parseInt(profileDraft.age, 10);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        nextErrors.age = "Please enter a valid age between 1 and 120.";
      }
    }

    if (profileDraft.barangay && barangayNames.length > 0) {
      if (!barangayNames.includes(profileDraft.barangay)) {
        nextErrors.barangay = "Please select a valid barangay.";
      }
    }

    setFieldErrors(nextErrors);
    return !hasAnyFieldError(nextErrors);
  };

  // ─── Save handler ──────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (isSaving) return;

    const isValid = validateProfile();
    if (!isValid) return;

    if (!hasChanges) {
      setModal({
        visible: true,
        title: "No Changes",
        message: "Your profile details are already up to date.",
        type: "info",
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await api.patch("/users/me", {
        fname: profileDraft.fname.trim(),
        mname: profileDraft.mname.trim() || undefined,
        lname: profileDraft.lname.trim(),
        username: profileDraft.username.trim(),
        email: profileDraft.email.trim(),
        phoneNumber: `+63${profileDraft.phoneNumber}`,
        age: profileDraft.age ? profileDraft.age : undefined,
        barangay: profileDraft.barangay.trim() || undefined,
        city: FIXED_CITY,
        province: FIXED_PROVINCE,
      });
      const updatedUser = unwrapCurrentUserPayload(response);

      if (updatedUser) {
        setAuthUser(updatedUser, {
          fallbackUsername: updatedUser.username,
          fallbackPhoneNumber: updatedUser.phoneNumber,
        });
        syncProfileState(updatedUser);
      }

      setFieldErrors(INITIAL_FIELD_ERRORS);
      setModal({
        visible: true,
        title: "Profile Updated",
        message: "Your profile details were saved successfully.",
        type: "success",
      });
    } catch (err) {

      const errorMessage = err?.message || "Failed to update profile. Please try again.";

      // 409 Conflict — always a duplicate field (username / email / phone).
      // api.js sets err.status = response.status, so this is reliable.
      if (err?.status === 409) {
        const mappedErrors = mapServerErrorToFieldErrors(errorMessage);
        setFieldErrors(mappedErrors);
        const firstErrorMessage = Object.values(mappedErrors).find(Boolean) || errorMessage;
        setModal({
          visible: true,
          title: "Update Failed",
          message: firstErrorMessage,
          type: "error",
        });
        return;
      }

      // Network / server / unexpected error
      const isNetworkError =
        errorMessage.toLowerCase().includes("network") ||
        errorMessage.toLowerCase().includes("failed to fetch") ||
        errorMessage.toLowerCase().includes("timed out");

      setModal({
        visible: true,
        title: isNetworkError ? "Connection Error" : "Update Failed",
        message: isNetworkError
          ? "Unable to reach the server. Please check your internet connection and try again."
          : errorMessage,
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Reset handler ─────────────────────────────────────────────────────────

  const handleReset = () => {
    setProfileDraft(savedProfile);
    setFieldErrors(INITIAL_FIELD_ERRORS);
  };

  // ─── Skeleton loading ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <ProfileSubpageLayout title="Edit Profile" refreshing={false} onRefresh={() => {}}>
        <View
          className="mb-4 rounded-2xl border px-4 py-4"
          style={{ borderColor: Colors.borderSoft, backgroundColor: Colors.background }}
        >
          <SkeletonBlock className="mb-4 h-3 w-40 rounded-md" />
          {Array.from({ length: 8 }).map((_, i) => (
            <FieldSkeleton key={i} />
          ))}
        </View>

        <View className="mb-2 flex-row gap-2">
          <SkeletonBlock className="flex-1 h-12 rounded-2xl" />
          <SkeletonBlock className="flex-1 h-12 rounded-2xl" />
        </View>
      </ProfileSubpageLayout>
    );
  }

  // ─── Main form ─────────────────────────────────────────────────────────────

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
          label="First Name"
          value={profileDraft.fname}
          onChangeText={setField("fname")}
          placeholder="e.g., Juan"
          autoComplete="name-given"
          textContentType="givenName"
          error={fieldErrors.fname}
        />

        <EditProfileTextField
          label="Middle Name"
          value={profileDraft.mname}
          onChangeText={setField("mname")}
          placeholder="e.g., Santos (Optional)"
          autoComplete="name-middle"
          textContentType="middleName"
        />

        <EditProfileTextField
          label="Last Name"
          value={profileDraft.lname}
          onChangeText={setField("lname")}
          placeholder="e.g., Dela Cruz"
          autoComplete="name-family"
          textContentType="familyName"
          error={fieldErrors.lname}
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
          error={fieldErrors.username}
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
          error={fieldErrors.email}
        />

        <EditProfileTextField
          label="Phone Number"
          value={profileDraft.phoneNumber}
          onChangeText={(value) => setField("phoneNumber")(value.replace(/\D/g, "").slice(0, 10))}
          placeholder="912 345 6789"
          prefix="+63"
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          maxLength={10}
          error={fieldErrors.phoneNumber}
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
          error={fieldErrors.age}
        />

        <Text className="mb-3 mt-1 text-xs font-bold uppercase tracking-wide" style={{ color: Colors.text.secondary }}>
          Location
        </Text>

        <BarangaySelectField
          label="Barangay"
          value={profileDraft.barangay}
          options={barangayNames}
          onChange={setField("barangay")}
          error={fieldErrors.barangay || barangayLoadError}
          loading={isBarangayLoading}
          disabled={isBarangayLoading || barangayNames.length === 0}
        />

        {barangayLoadError ? (
          <Pressable
            onPress={loadBarangays}
            className="mb-4 self-start rounded-full border px-4 py-2"
            style={{ borderColor: Colors.borderMuted }}
            accessibilityRole="button"
            accessibilityLabel="Retry loading barangays"
          >
            <Text className="text-xs font-semibold" style={{ color: Colors.text.bodySoft }}>
              Refresh and try again
            </Text>
          </Pressable>
        ) : null}

        <EditProfileTextField
          label="City"
          value={profileDraft.city}
          onChangeText={() => {}}
          placeholder="Sto. Tomas"
          editable={false}
          helperText="Service area is fixed to Sto. Tomas."
        />

        <EditProfileTextField
          label="Province"
          value={profileDraft.province}
          onChangeText={() => {}}
          placeholder="Batangas"
          editable={false}
          helperText="Service area is fixed to Batangas."
        />
      </View>

      <View className="mb-2 flex-row gap-2">
        <Pressable
          onPress={handleReset}
          accessibilityRole="button"
          disabled={isSaving || !hasChanges}
          className="flex-1 items-center rounded-2xl border px-4 py-3"
          style={{
            borderColor: (!hasChanges || isSaving) ? Colors.borderSoft : Colors.primarySoft,
            backgroundColor: (!hasChanges || isSaving) ? Colors.ui.graySoft : Colors.ui.infoSurface,
            opacity: (!hasChanges || isSaving) ? 0.6 : 1,
          }}
        >
          <Text
            className="text-sm font-bold"
            style={{ color: (!hasChanges || isSaving) ? Colors.text.secondary : Colors.primaryStrong }}
          >
            Reset
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSave}
          accessibilityRole="button"
          disabled={isSaving}
          className="flex-1 items-center rounded-2xl px-4 py-3"
          style={{ backgroundColor: isSaving ? Colors.primary : Colors.primaryStrong }}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={Colors.text.inverse} />
          ) : (
            <Text className="text-sm font-bold" style={{ color: Colors.text.inverse }}>
              Save Changes
            </Text>
          )}
        </Pressable>
      </View>

      <FeedbackModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal((prev) => ({ ...prev, visible: false }))}
      />
    </ProfileSubpageLayout>
  );
}