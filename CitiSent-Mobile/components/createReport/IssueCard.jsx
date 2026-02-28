import { Image, Text, TouchableOpacity, View } from "react-native";

export default function IssueCard({ label, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="mb-3 basis-[31.5%] rounded-2xl bg-[#C7D8E6] px-2 py-3"
    >
      <View className="mx-auto h-16 w-16 items-center justify-center rounded-full border border-[#8CB9DD] bg-[#A9D1F0]">
        <Image
          source={require("../../assets/PublicAgencies/cityhall.png")}
          className="h-9 w-9 rounded-full"
          resizeMode="cover"
        />
      </View>

      <Text className="mt-2 text-center text-[11px] font-semibold leading-4 text-[#111827]">
        {label}
      </Text>
    </TouchableOpacity>
  );
}
