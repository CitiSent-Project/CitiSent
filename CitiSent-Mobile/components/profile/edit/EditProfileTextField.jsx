import { Text, TextInput, View } from "react-native";
import { Colors } from "../../../modules/shared";

export default function EditProfileTextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "sentences",
  autoComplete,
  textContentType,
  multiline = false,
  numberOfLines,
  helperText,
  maxLength,
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold" style={{ color: Colors.text.fieldLabel }}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.secondary}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        textContentType={textContentType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        accessibilityLabel={label}
        className="rounded-2xl border px-4 py-3 text-base"
        style={{
          borderColor: Colors.borderSoft,
          backgroundColor: Colors.background,
          color: Colors.text.bodyStrong,
          minHeight: multiline ? 96 : 52,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />

      {helperText ? (
        <Text className="mt-1 text-xs" style={{ color: Colors.text.secondary }}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}