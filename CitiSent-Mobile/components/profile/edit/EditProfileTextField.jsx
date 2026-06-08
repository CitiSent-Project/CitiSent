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
  editable = true,
  error,
}) {
  const hasError = Boolean(error);

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
        editable={editable}
        accessibilityLabel={label}
        className="rounded-2xl border px-4 py-3 text-base"
        style={{
          borderColor: hasError
            ? Colors.error
            : editable
              ? Colors.borderSoft
              : Colors.borderLight,
          backgroundColor: editable ? Colors.background : Colors.ui.neutralMuted,
          color: editable ? Colors.text.bodyStrong : Colors.text.secondary,
          minHeight: multiline ? 96 : 52,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />

      {hasError ? (
        <Text className="mt-1 text-xs" style={{ color: Colors.error }}>
          {error}
        </Text>
      ) : helperText ? (
        <Text className="mt-1 text-xs" style={{ color: Colors.text.secondary }}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}