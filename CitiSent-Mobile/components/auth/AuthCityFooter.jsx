import { Image, View } from "react-native";

export default function AuthCityFooter() {
  return (
    <View className="absolute bottom-0 left-0 right-0 h-[170px] overflow-hidden">
      <Image
        source={require("../../assets/logo/cityhall.png")}
        className="h-full w-full opacity-25"
        resizeMode="cover"
        blurRadius={2}
      />
      <View className="absolute inset-0 bg-[#1B2D4F]/35" />
    </View>
  );
}
