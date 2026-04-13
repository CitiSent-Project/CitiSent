import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

export default function AuthSelectField({
  label,
  placeholder,
  value,
  options = [],
  onChange,
  error,
  disabled = false,
  loading = false,
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  const selectedLabel = options.find((option) => option.value === value)?.label || "";

  function handleOpen() {
    if (!disabled && !loading) {
      setIsOpen(true);
    }
  }

  function handleSelect(nextValue) {
    onChange?.(nextValue);
    setIsOpen(false);
  }

  return (
    <View className="mb-4 w-full">
      <Text className="mb-2 px-1 text-[13px] font-semibold text-[#CFDAEA]">{label}</Text>

      <Pressable
        onPress={handleOpen}
        className={`h-[48px] flex-row items-center justify-between rounded-full border px-4 ${
          error ? "border-[#FCA5A5]" : "border-[#D5E6FF]"
        }`}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        accessibilityLabel={label}
        style={disabled ? { opacity: 0.7 } : undefined}
      >
        <Text className={`text-[15px] ${selectedLabel ? "text-[#DDEBFF]" : "text-[#8CA8C9]"}`}>
          {loading ? "Loading options..." : selectedLabel || placeholder}
        </Text>
        <Ionicons name="chevron-down-outline" size={18} color="#B7CCE6" />
      </Pressable>

      {error ? <Text className="mt-1 px-1 text-[12px] text-[#FCA5A5]">{error}</Text> : null}

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <View className="flex-1 justify-end bg-black/45">
          <View className="max-h-[68%] rounded-t-3xl bg-[#14233D] px-5 pb-8 pt-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-[17px] font-semibold text-[#DDEBFF]">Select {label}</Text>
              <Pressable
                onPress={() => setIsOpen(false)}
                className="rounded-full border border-[#44618E] px-3 py-1"
                accessibilityRole="button"
                accessibilityLabel={`Close ${label} options`}
              >
                <Text className="text-[12px] font-semibold text-[#B7CCE6]">Close</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((option) => {
                const isSelected = option.value === value;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => handleSelect(option.value)}
                    className="mb-2 rounded-xl border px-4 py-3"
                    style={{
                      borderColor: isSelected ? "#3C75D8" : "#44618E",
                      backgroundColor: isSelected ? "#1E3F73" : "transparent",
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${label}: ${option.label}`}
                  >
                    <Text className="text-[14px] font-semibold text-[#DDEBFF]">{option.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
