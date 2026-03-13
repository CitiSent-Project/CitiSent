import { Pressable, Text, View } from "react-native";

export default function AuthChoiceField({ label, options = [], value = "", onChange, error }) {
  return (
    <View className="mb-4 w-full">
      <Text className="mb-2 px-1 text-[13px] font-semibold text-[#CFDAEA]">{label}</Text>

      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = value === option.value;

          return (
            <Pressable
              key={option.value}
              onPress={() => onChange?.(option.value)}
              className={`rounded-full border px-4 py-2 ${
                isSelected ? "border-[#3C75D8] bg-[#3C75D8]" : "border-[#D5E6FF] bg-transparent"
              }`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${label}: ${option.label}`}
            >
              <Text className={`text-[12px] font-semibold ${isSelected ? "text-[#DDEBFF]" : "text-[#AFC6E4]"}`}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text className="mt-1 px-1 text-[12px] text-[#FCA5A5]">{error}</Text> : null}
    </View>
  );
}