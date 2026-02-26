import { Image, ImageBackground, Text, View } from "react-native";

export default function HomeHero() {
  return (
    <View className="-mt-1 overflow-hidden bg-[#D1E6FF] shadow-bottom-lg">
      <ImageBackground
        source={require("../../assets/logo/cityhall.png")}
        resizeMode="cover"
        className="h-[230px] w-full items-center justify-center"
      >
        <View className="absolute inset-0 bg-white/30" />

        <View className="items-center px-5">
          <Image
            source={require("../../assets/logo/logo-citisent.png")}
            resizeMode="contain"
            className="h-24 w-24"
          />
          <Text className="mt-1 text-3xl font-extrabold text-[#223D68]">CitySent</Text>
        </View>
      </ImageBackground>
    </View>
  );
}
