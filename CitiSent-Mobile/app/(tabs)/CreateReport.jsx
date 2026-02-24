import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function CreateReportScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center gap-6">
        <Text className="text-2xl font-bold text-gray-900">Create Report</Text>
        <Text className="text-base text-gray-500 text-center px-8">
          Create a new report to alert authorities about issues in your area.
        </Text>
      </View>
    </SafeAreaView>
  );
}
