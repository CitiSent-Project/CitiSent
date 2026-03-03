import { Pressable, ScrollView, Text, View } from "react-native";

const chipStyles = {
  all: { activeContainer: "bg-[#223D68]", activeText: "text-white", inactiveContainer: "bg-[#D1E6FF]", inactiveText: "text-[#223D68]" },
  emergency: { activeContainer: "bg-[#FF0000]", activeText: "text-white", inactiveContainer: "bg-[#FFE3E3]", inactiveText: "text-[#991B1B]" },
  urgent: { activeContainer: "bg-[#FF8A00]", activeText: "text-white", inactiveContainer: "bg-[#FFE7CC]", inactiveText: "text-[#9A3412]" },
  moderate: { activeContainer: "bg-[#FFDD00]", activeText: "text-black", inactiveContainer: "bg-[#FFF7BF]", inactiveText: "text-[#713F12]" },
  low: { activeContainer: "bg-[#20FF00]", activeText: "text-black", inactiveContainer: "bg-[#D8FFD1]", inactiveText: "text-[#166534]" },
};

const priorityOptions = [
  { key: "all", label: "All" },
  { key: "emergency", label: "Emergency" },
  { key: "urgent", label: "Urgent" },
  { key: "moderate", label: "Moderate" },
  { key: "low", label: "Low priority" },
];

export default function PriorityChips({ selectedPriority = "all", onSelectPriority }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-4"
      contentContainerClassName="flex-row flex-nowrap items-center gap-2 pr-2"
    >
      {priorityOptions.map((option) => {
        const isSelected = selectedPriority === option.key;
        const containerClass = isSelected
          ? chipStyles[option.key].activeContainer
          : chipStyles[option.key].inactiveContainer;
        const textClass = isSelected ? chipStyles[option.key].activeText : chipStyles[option.key].inactiveText;

        return (
          <Pressable
            key={option.key}
            onPress={() => onSelectPriority?.(option.key)}
            className="rounded-full"
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <View className={`rounded-full px-3 py-1 ${containerClass}`}>
              <Text className={`text-[11px] font-extrabold ${textClass}`}>{option.label}</Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
