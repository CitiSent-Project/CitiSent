import { Ionicons } from "@expo/vector-icons";
import { Image, Text, View } from "react-native";

const statusStyles = {
  COMPLETED: "text-[#43AE77]",
  "IN PROGRESS": "text-[#4A8FC3]",
};

export default function NearbyReportRow({ report }) {
  const imageSource =
    typeof report.imageFile === "string"
      ? { uri: report.imageFile }
      : report.imageFile;

  return (
    <View className="flex-row items-start border-b border-[#ECECEC] py-2">
      <View className="flex-1 pr-2.5">
        <Text numberOfLines={2} className="text-base font-bold text-[#425A78]">
          {report.title}
        </Text>
        <Text numberOfLines={2} className="mt-0.5 text-sm font-semibold text-[#6D7480]">
          {report.address}
        </Text>

        <View className="mt-1.5 flex-row items-center gap-2">
          <Text className={`text-[13px] font-extrabold ${statusStyles[report.status] || "text-[#4A8FC3]"}`}>
            {report.status}
          </Text>
          <Text className="text-[12px] text-[#8F96A3]">{report.time}</Text>
        </View>
      </View>

      <View className="w-[30%] max-w-[110px] pl-1">
        <Image
          source={imageSource}
          className="h-24 w-full rounded-sm"
          resizeMode="cover"
        />
      </View>
    </View>
  );
}
