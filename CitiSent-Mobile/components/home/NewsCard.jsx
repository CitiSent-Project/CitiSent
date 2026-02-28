import { Image, Text, View } from "react-native";

export default function NewsCard() {
  return (
    <View className="mb-6 overflow-hidden rounded-xl border border-[#ECECEC] bg-white">
      <View className="flex-row items-stretch">
        <View className="w-[40%]">
          <Image
            source={require("../../assets/PublicAgencies/cityhall.png")}
            className="w-full h-full min-h-[96px]"
            resizeMode="cover"
          />
        </View>
        <View className="flex-1 justify-center px-3 py-2">
          <Text numberOfLines={3} className="text-lg font-extrabold leading-6 text-[#1F1F1F]">
            MUTYA NG STO. TOMAS
          </Text>
          <Text className="mt-1 text-xs text-[#6B7280]">Local community feature</Text>
        </View>
      </View>
    </View>
  );
}
