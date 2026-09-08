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
}) {
  const router = useRouter();

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
              borderColor: agreeTerms ? "#57AEFF" : "#6782A7",
              backgroundColor: agreeTerms ? "#57AEFF" : "transparent",
            }}
          >
            {agreeTerms ? <Ionicons name="checkmark" size={14} color="#1B2D4F" /> : null}
          </Pressable>

          <View className="flex-1 flex-row flex-wrap items-center">
            <Text className="text-[13px] text-[#CFDAEA]">I agree to the </Text>
            <Pressable
              onPress={() => router.push("/legal/terms")}
              hitSlop={6}
              accessibilityRole="link"
              accessibilityLabel="View Terms & Conditions"
            >
              <Text className="text-[13px] font-bold text-[#57AEFF] underline">
                Terms &amp; Conditions
              </Text>
            </Pressable>
            <Text className="text-[13px] text-[#CFDAEA]">.</Text>
          </View>
        </View>

        {termsError ? (
          <Text className="mt-1 pl-8 text-[12px] text-[#FCA5A5]">{termsError}</Text>
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
              borderColor: agreePrivacy ? "#57AEFF" : "#6782A7",
              backgroundColor: agreePrivacy ? "#57AEFF" : "transparent",
            }}
          >
            {agreePrivacy ? <Ionicons name="checkmark" size={14} color="#1B2D4F" /> : null}
          </Pressable>

          <View className="flex-1 flex-row flex-wrap items-center">
            <Text className="text-[13px] text-[#CFDAEA]">I have read and understood the </Text>
            <Pressable
              onPress={() => router.push("/legal/privacy")}
              hitSlop={6}
              accessibilityRole="link"
              accessibilityLabel="View Privacy Notice"
            >
              <Text className="text-[13px] font-bold text-[#57AEFF] underline">
                Privacy Notice
              </Text>
            </Pressable>
            <Text className="text-[13px] text-[#CFDAEA]">.</Text>
          </View>
        </View>

        {privacyError ? (
          <Text className="mt-1 pl-8 text-[12px] text-[#FCA5A5]">{privacyError}</Text>
        ) : null}
      </View>
    </View>
  );
}
