import { Text, View } from "react-native";
import { Colors } from "../../../constants/colors";

export default function BreadcrumbsNav({ items = [] }) {
  return (
    <View className="border-b bg-white px-4 py-2" style={{ borderColor: Colors.border }}>
      <Text className="text-xs" style={{ color: Colors.text.secondary }}>{items.join(" > ")}</Text>
    </View>
  );
}
