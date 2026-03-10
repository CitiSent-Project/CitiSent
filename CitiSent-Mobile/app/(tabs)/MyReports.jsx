import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MyReportsTopBar from "../../components/myReports/MyReportsTopBar";

export default function MyReportsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <MyReportsTopBar />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-center text-xl font-bold text-[#223D68]">Under Construction</Text>
      </View>
    </View>
  );
}
