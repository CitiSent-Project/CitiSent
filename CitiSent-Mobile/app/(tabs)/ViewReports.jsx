import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ViewReportsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold text-gray-900">View Reports</Text>
        <Text className="text-base text-gray-500 mt-2">
          Browse all submitted reports
        </Text>
      </View>
    </View>
  );
}
