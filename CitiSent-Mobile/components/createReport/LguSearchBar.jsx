import { Platform, Pressable, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../modules/shared";

export default function LguSearchBar({
  value = "",
  onChangeText,
  placeholder = "Search LGU office...",
  disabled = false,
}) {
  const hasText = Boolean(value && value.length > 0);

  return (
    <View
      className="mb-4 flex-row items-center rounded-2xl bg-white px-3.5 shadow-sm border"
      style={{
        borderColor: "#E2E8F0",
        minHeight: 48,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Ionicons
        name="search-outline"
        size={20}
        color={Colors.text.secondary}
        style={{ marginRight: 2 }}
      />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.secondary}
        className="ml-2 flex-1 text-sm font-medium"
        style={{
          color: Colors.text.primary,
          paddingVertical: Platform.OS === "ios" ? 10 : 6,
        }}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        editable={!disabled}
        accessibilityRole="search"
        accessibilityLabel="Search LGU office"
      />

      {hasText && !disabled ? (
        <Pressable
          onPress={() => onChangeText("")}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          className="p-1"
        >
          <Ionicons
            name="close-circle"
            size={18}
            color={Colors.text.secondary}
          />
        </Pressable>
      ) : null}
    </View>
  );
}
