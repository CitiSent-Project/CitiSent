import { Text, View } from "react-native";
import { Colors } from "../../../modules/shared";

export default function BreadcrumbsNav({ items = [] }) {
  return (
    <View className="border-b px-4 py-2" style={{ borderColor: Colors.border, backgroundColor: Colors.screen.tabs }}>
      <Text className="text-xs" style={{ color: Colors.text.secondary }}>{items.join(" > ")}</Text>
    </View>
  );
}
