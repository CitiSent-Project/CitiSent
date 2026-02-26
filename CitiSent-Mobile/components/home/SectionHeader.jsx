import { Text, TouchableOpacity, View } from "react-native";

export default function SectionHeader({ title, onPressSeeAll }) {
  return (
    <View className="mb-3 mt-1 flex-row items-center justify-between">
      <Text className="text-[32px] font-bold text-[#1E1E1E]" style={{ fontSize: 25, lineHeight: 36 }}>
        {title}
      </Text>
      <TouchableOpacity onPress={onPressSeeAll} activeOpacity={0.7}>
        <Text className="text-sm font-semibold text-[#223D68]">See all</Text>
      </TouchableOpacity>
    </View>
  );
}
