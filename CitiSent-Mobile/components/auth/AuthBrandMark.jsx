import { Image, View } from "react-native";

export default function AuthBrandMark({ size = 130 }) {
  return (
    <View className="items-center">
      <Image
        source={require("../../assets/logo/logo-citisent.png")}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}
