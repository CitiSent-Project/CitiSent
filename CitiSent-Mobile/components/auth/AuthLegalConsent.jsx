import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

export default function AuthLegalConsent({
  agreeTerms = false,
  onToggleTerms,
  termsError,
  agreePrivacy = false,
  onTogglePrivacy,
  privacyError,
  theme = "dark",
  variant,
}) {
  const router = useRouter();
  const isLight = variant === "light" || theme === "light";

  const textColor = isLight ? "#334155" : "#CFDAEA";
  const linkColor = isLight ? "#1D4ED8" : "#57AEFF";
  const errorColor = isLight ? "#DC2626" : "#FCA5A5";

  const checkboxBorderColorTerms = agreeTerms
    ? (isLight ? "#1D4ED8" : "#57AEFF")
    : (isLight ? "#64748B" : "#6782A7");
  const checkboxBgColorTerms = agreeTerms
    ? (isLight ? "#1D4ED8" : "#57AEFF")
    : (isLight ? "#FFFFFF" : "transparent");
  const checkmarkColorTerms = isLight ? "#FFFFFF" : "#1B2D4F";

  const checkboxBorderColorPrivacy = agreePrivacy
    ? (isLight ? "#1D4ED8" : "#57AEFF")
    : (isLight ? "#64748B" : "#6782A7");
  const checkboxBgColorPrivacy = agreePrivacy
    ? (isLight ? "#1D4ED8" : "#57AEFF")
    : (isLight ? "#FFFFFF" : "transparent");
  const checkmarkColorPrivacy = isLight ? "#FFFFFF" : "#1B2D4F";

  return (
    <View className="mb-4 mt-2 w-full">
      {/* Terms & Conditions Checkbox */}
      <View className="mb-3">
        <View className="flex-row items-center">
          <Pressable
            onPress={onToggleTerms}
            hitSlop={8}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreeTerms }}
            accessibilityLabel="I agree to the Terms & Conditions"
            className="mr-3 h-5 w-5 items-center justify-center rounded border"
            style={{
              borderColor: checkboxBorderColorTerms,
              backgroundColor: checkboxBgColorTerms,
            }}
          >
            {agreeTerms ? <Ionicons name="checkmark" size={14} color={checkmarkColorTerms} /> : null}
          </Pressable>

          <View className="flex-1 flex-row flex-wrap items-center">
            <Pressable onPress={onToggleTerms} hitSlop={4}>
              <Text className="text-[13px] font-medium" style={{ color: textColor }}>
                I agree to the{" "}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/legal/terms")}
              hitSlop={6}
              accessibilityRole="link"
              accessibilityLabel="View Terms & Conditions"
            >
              <Text className="text-[13px] font-bold underline" style={{ color: linkColor }}>
                Terms &amp; Conditions
              </Text>
            </Pressable>
            <Text className="text-[13px] font-medium" style={{ color: textColor }}>.</Text>
          </View>
        </View>

        {termsError ? (
          <Text className="mt-1 pl-8 text-[12px]" style={{ color: errorColor }}>{termsError}</Text>
        ) : null}
      </View>

      {/* Privacy Notice Checkbox */}
      <View className="mb-1">
        <View className="flex-row items-center">
          <Pressable
            onPress={onTogglePrivacy}
            hitSlop={8}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreePrivacy }}
            accessibilityLabel="I have read and understood the Privacy Notice"
            className="mr-3 h-5 w-5 items-center justify-center rounded border"
            style={{
              borderColor: checkboxBorderColorPrivacy,
              backgroundColor: checkboxBgColorPrivacy,
            }}
          >
            {agreePrivacy ? <Ionicons name="checkmark" size={14} color={checkmarkColorPrivacy} /> : null}
          </Pressable>

          <View className="flex-1 flex-row flex-wrap items-center">
            <Pressable onPress={onTogglePrivacy} hitSlop={4}>
              <Text className="text-[13px] font-medium" style={{ color: textColor }}>
                I have read and understood the{" "}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/legal/privacy")}
              hitSlop={6}
              accessibilityRole="link"
              accessibilityLabel="View Privacy Notice"
            >
              <Text className="text-[13px] font-bold underline" style={{ color: linkColor }}>
                Privacy Notice
              </Text>
            </Pressable>
            <Text className="text-[13px] font-medium" style={{ color: textColor }}>.</Text>
          </View>
        </View>

        {privacyError ? (
          <Text className="mt-1 pl-8 text-[12px]" style={{ color: errorColor }}>{privacyError}</Text>
        ) : null}
      </View>
    </View>
  );
}
