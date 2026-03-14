import { Image, View } from "react-native";

export default function CreateReportImageFooter({ bottomOffset = 0 }) {
  return (
    <View
      className="absolute left-0 right-0 overflow-hidden"
      style={{ bottom: bottomOffset }}
    >
      <Image
        source={require("../../assets/logo/cityhall.png")}
        resizeMode="cover"
        className="h-40 w-full opacity-55"
      />
    </View>
  );
}