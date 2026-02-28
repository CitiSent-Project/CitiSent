import { Text, View } from "react-native";

export default function BreadcrumbsNav({ items = [] }) {
  return (
    <View className="border-b border-[#E5E7EB] bg-white px-4 py-2">
      <Text className="text-xs text-[#6B7280]">{items.join(" > ")}</Text>
    </View>
  );
}
