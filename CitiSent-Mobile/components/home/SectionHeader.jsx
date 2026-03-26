import { Text, View } from "react-native";
import { Colors } from "../../modules/shared";

export default function SectionHeader({ title }) {
  return (
    <View className="mb-3 mt-1 flex-row items-center justify-between">
      <Text className="flex-1 pr-3 text-2xl font-bold leading-8" style={{ color: Colors.text.headingNeutral }}>
        {title}
      </Text>
    </View>
  );
}
