import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { Colors } from "../../modules/shared";

export default function ReportCard({ report, containerClassName = "mb-4" }) {
  return (
    <View className={`${containerClassName} rounded-2xl border bg-white px-3 py-3 shadow-sm`} style={{ borderColor: Colors.borderCard }}>
      <View className="flex-row items-start">
        <View className="mr-2 h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: Colors.ui.grayAvatar }}>
          <Ionicons name="person" size={21} color={Colors.icon.light} />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text numberOfLines={1} className="pr-2 text-base font-extrabold" style={{ color: Colors.text.titleDark }}>
              {report.name}
            </Text>
            <Text className="text-xs" style={{ color: Colors.text.mutedBlue }}>{report.time}</Text>
          </View>

          <Text className="mt-2 pr-1 text-xs leading-4" style={{ color: "#222" }}>{report.message}</Text>

          <View className="mt-2 flex-row items-center justify-end gap-1">
            <Ionicons name="location-outline" size={13} color={Colors.icon.subtle} />
            <Text className="text-xs" style={{ color: Colors.icon.subtle }}>{report.location}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
