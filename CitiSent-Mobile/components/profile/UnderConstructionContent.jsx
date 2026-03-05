import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export default function UnderConstructionContent() {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-[#DCE9F8]">
        <Ionicons name="construct-outline" size={30} color="#223D68" />
      </View>
      <Text className="text-center text-xl font-bold text-[#223D68]">Still under construction</Text>
    </View>
  );
}
