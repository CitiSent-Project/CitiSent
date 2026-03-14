import { Image, View } from "react-native";

export default function AuthCityFooter({ backgroundColor = "transparent" }) {
  return (
    <View
      pointerEvents="none"
      className="absolute bottom-0 left-0 right-0 h-[170px] overflow-hidden"
      style={{ backgroundColor }}
    >
      <Image
        source={require("../../assets/logo/cityhall.png")}
        className="h-full w-full opacity-25"
        resizeMode="cover"
      />
    </View>
  );
}
