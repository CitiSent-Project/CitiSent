import { Image, Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../../constants/colors";

export default function IssueCard({ label, logoSource, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="mb-3 basis-[31.5%] rounded-2xl px-2 py-3"
      style={{ backgroundColor: Colors.ui.issueCardSoft }}
    >
      <View className="items-center justify-center">
        <Image
          source={logoSource}
          className="h-20 w-20 rounded-full"
          resizeMode="cover"
        />
      </View>

      <Text className="mt-2 text-center text-[11px] font-semibold leading-4 text-[#111827]">
        {label}
      </Text>
    </TouchableOpacity>
  );
}
