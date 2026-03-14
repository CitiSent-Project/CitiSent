import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { Colors } from "../../constants/colors";

export default function UnderConstructionContent() {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text className="text-center text-xl font-bold" style={{ color: Colors.text.headingBrand }}>Still under construction</Text>
    </View>
  );
}
