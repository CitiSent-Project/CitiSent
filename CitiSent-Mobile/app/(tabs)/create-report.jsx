import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateReportScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold text-gray-900">Create Report</Text>
        <Text className="text-base text-gray-500 mt-2">
          Submit a new incident report
        </Text>
      </View>
    </SafeAreaView>
  );
}
