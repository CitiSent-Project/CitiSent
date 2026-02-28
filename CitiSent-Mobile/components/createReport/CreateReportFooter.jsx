import { Image, View } from "react-native";

export default function CreateReportFooter() {
  return (
    <View className="mt-auto w-full pt-8">
      <View className="z-10 mb-[-20px] items-center">
      </View>

      <Image
        source={require("../../assets/PublicAgencies/cityhall.png")}
        className="h-25 w-full"
        resizeMode="cover"
      />
    </View>
  );
}
