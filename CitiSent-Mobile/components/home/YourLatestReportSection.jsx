import { Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../../modules/shared";
import { useNavigation } from "@react-navigation/native";

export default function YourLatestReportSection({ title }) {
  const navigation = useNavigation();

  return (
    <View className="mb-3 flex-row items-center justify-between">
      <Text
        className="flex-1 pr-3 text-2xl font-bold leading-8"
        style={{ color: Colors.text.headingNeutral }}
      >
        {title}
      </Text>

      <TouchableOpacity
        onPress={() => navigation.navigate("MyReports")}
        activeOpacity={0.7}
      >
        <Text
          className="text-sm font-semibold"
          style={{ color: Colors.text.headingBrand }}
        >
          See all
        </Text>
      </TouchableOpacity>
    </View>
  );
}