import { Text, TouchableOpacity, View } from "react-native";

export default function SectionHeader({ title, onPressSeeAll }) {
  return (
    <View className="mb-3 mt-1 flex-row items-center justify-between">
      <Text className="flex-1 pr-3 text-2xl font-bold leading-8 text-[#1E1E1E]">
        {title}
      </Text>
      <TouchableOpacity onPress={onPressSeeAll} activeOpacity={0.7}>
        <Text className="text-sm font-semibold text-[#223D68]">See all</Text>
      </TouchableOpacity>
    </View>
  );
}
