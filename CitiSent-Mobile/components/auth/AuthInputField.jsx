import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";

export default function AuthInputField({
  value,
  onChangeText,
  placeholder,
  icon,
  error,
  keyboardType = "default",
  autoComplete,
  textContentType,
  returnKeyType,
  onSubmitEditing,
  secureTextEntry = false,
  showPasswordToggle = false,
  passwordVisible = false,
  onTogglePassword,
  prefix,
  maxLength,
}) {
  return (
    <View className="mb-4 w-full">
      <View
        className={`h-[48px] flex-row items-center rounded-full border px-4 ${
          error ? "border-[#FCA5A5]" : "border-[#D5E6FF]"
        }`}
      >
        <Ionicons name={icon} size={18} color={error ? "#FCA5A5" : "#B7CCE6"} />

        {prefix ? (
          <Text className="ml-3 text-[15px] font-semibold text-[#DDEBFF]">{prefix}</Text>
        ) : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8CA8C9"
          className={`${prefix ? "ml-1" : "ml-3"} flex-1 text-[15px] text-[#DDEBFF]`}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          textContentType={textContentType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
        />

        {showPasswordToggle ? (
          <Pressable onPress={onTogglePassword} accessibilityRole="button" accessibilityLabel="Toggle password visibility">
            <Ionicons name={passwordVisible ? "eye-off-outline" : "eye-outline"} size={18} color="#B7CCE6" />
          </Pressable>
        ) : null}
      </View>

      {error ? <Text className="mt-1 px-1 text-[12px] text-[#FCA5A5]">{error}</Text> : null}
    </View>
  );
}
