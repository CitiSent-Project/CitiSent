import { useState, useMemo } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../../modules/shared";

export default function BarangaySelectField({
  label,
  value,
  options = [],
  onChange,
  error,
  loading = false,
  disabled = false,
  placeholder = "Select barangay",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const hasError = Boolean(error);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) {
      return options;
    }

    const query = searchQuery.toLowerCase().trim();
    return options.filter((option) => option.toLowerCase().includes(query));
  }, [options, searchQuery]);

  function handleOpen() {
    if (!disabled && !loading) {
      setSearchQuery("");
      setIsOpen(true);
    }
  }

  function handleSelect(nextValue) {
    onChange?.(nextValue);
    setIsOpen(false);
  }

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold" style={{ color: Colors.text.fieldLabel }}>
        {label}
      </Text>

      <Pressable
        onPress={handleOpen}
        className="flex-row items-center justify-between rounded-2xl border px-4"
        style={{
          borderColor: hasError ? Colors.error : Colors.borderSoft,
          backgroundColor: Colors.background,
          minHeight: 52,
          opacity: disabled ? 0.6 : 1,
        }}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        accessibilityLabel={label}
      >
        {loading ? (
          <View className="flex-row items-center gap-2 py-3">
            <ActivityIndicator size="small" color={Colors.text.secondary} />
            <Text className="text-base" style={{ color: Colors.text.secondary }}>
              Loading barangays...
            </Text>
          </View>
        ) : (
          <Text
            className="flex-1 py-3 text-base"
            style={{ color: value ? Colors.text.bodyStrong : Colors.text.secondary }}
          >
            {value || placeholder}
          </Text>
        )}
        <Ionicons name="chevron-down-outline" size={18} color={Colors.text.bodySoft} />
      </Pressable>

      {hasError ? (
        <Text className="mt-1 text-xs" style={{ color: Colors.error }}>
          {error}
        </Text>
      ) : null}

      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <View
            className="max-h-[72%] rounded-t-3xl px-5 pb-8 pt-4"
            style={{ backgroundColor: Colors.surface }}
          >
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-bold" style={{ color: Colors.text.heading }}>
                Select {label}
              </Text>
              <Pressable
                onPress={() => setIsOpen(false)}
                className="rounded-full border px-3 py-1.5"
                style={{ borderColor: Colors.borderMuted }}
                accessibilityRole="button"
                accessibilityLabel={`Close ${label} options`}
              >
                <Text className="text-xs font-semibold" style={{ color: Colors.text.bodySoft }}>
                  Close
                </Text>
              </Pressable>
            </View>

            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search barangay..."
              placeholderTextColor={Colors.text.secondary}
              autoCapitalize="none"
              className="mb-3 rounded-xl border px-4 py-3 text-sm"
              style={{
                borderColor: Colors.borderSoft,
                backgroundColor: Colors.background,
                color: Colors.text.bodyStrong,
              }}
            />

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {filteredOptions.length === 0 ? (
                <View className="items-center py-8">
                  <Text className="text-sm" style={{ color: Colors.text.secondary }}>
                    {searchQuery.trim() ? "No barangays found." : "No barangays available."}
                  </Text>
                </View>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = option === value;

                  return (
                    <Pressable
                      key={option}
                      onPress={() => handleSelect(option)}
                      className="mb-2 rounded-xl border px-4 py-3"
                      style={{
                        borderColor: isSelected ? Colors.primary : Colors.borderSoft,
                        backgroundColor: isSelected ? Colors.ui.infoSurface : Colors.background,
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`${label}: ${option}`}
                    >
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: isSelected ? Colors.primaryStrong : Colors.text.body }}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
