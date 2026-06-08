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
  prefix,
}) {
  const hasError = Boolean(error);

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold" style={{ color: Colors.text.fieldLabel }}>
        {label}
      </Text>

      <View
        className="flex-row items-center rounded-2xl border px-4"
        style={{
          borderColor: hasError
            ? Colors.error
            : editable
              ? Colors.borderSoft
              : Colors.borderLight,
          backgroundColor: editable ? Colors.background : Colors.ui.neutralMuted,
          minHeight: multiline ? 96 : 52,
        }}
      >
        {prefix ? (
          <Text
            className="text-base font-semibold mr-1"
            style={{ color: editable ? Colors.text.bodyStrong : Colors.text.secondary }}
          >
            {prefix}
          </Text>
        ) : null}

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
          className="flex-1 text-base py-3"
          style={{
            color: editable ? Colors.text.bodyStrong : Colors.text.secondary,
            textAlignVertical: multiline ? "top" : "center",
          }}
        />
      </View>

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