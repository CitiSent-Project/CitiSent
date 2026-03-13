import { Pressable, Text, View } from "react-native";

export const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

export default function StatusFilterChips({ selectedStatus = "all", onSelectStatus }) {
  return (
    <View className="mb-4 flex-row flex-wrap gap-2">
      {STATUS_FILTERS.map((filter) => {
        const active = selectedStatus === filter.key;

        return (
          <Pressable
            key={filter.key}
            onPress={() => onSelectStatus?.(filter.key)}
            className={`rounded-full border px-4 py-2 ${active ? "border-[#1D4ED8] bg-[#1D4ED8]" : "border-[#CBD5E1] bg-white"}`}
          >
            <Text className={`text-xs font-bold ${active ? "text-white" : "text-[#334155]"}`}>{filter.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}