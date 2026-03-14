import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export default function ReportCard({ report, containerClassName = "mb-4" }) {
  return (
    <View className={`${containerClassName} rounded-2xl border border-[#E2E2E2] bg-white px-3 py-3 shadow-sm`}>
      <View className="flex-row items-start">
        <View className="mr-2 h-10 w-10 items-center justify-center rounded-full bg-[#E5E5E5]">
          <Ionicons name="person" size={21} color="#A3A3A3" />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text numberOfLines={1} className="pr-2 text-base font-extrabold text-[#1D1D1D]">
              {report.name}
            </Text>
            <Text className="text-xs text-[#6A97C6]">{report.time}</Text>
          </View>

          <Text className="mt-2 pr-1 text-xs leading-4 text-[#222]">{report.message}</Text>

          <View className="mt-2 flex-row items-center justify-end gap-1">
            <Ionicons name="location-outline" size={13} color="#A0A0A0" />
            <Text className="text-xs text-[#A0A0A0]">{report.location}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
