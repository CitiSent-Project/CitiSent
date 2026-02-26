import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

function Tag({ text, className }) {
  return (
    <View className={`rounded-full px-2 py-0.5 ${className}`}>
      <Text className="text-[10px] font-semibold text-white">{text}</Text>
    </View>
  );
}

export default function LatestReportCard() {
  return (
    <View className="mb-7 rounded-2xl border border-[#E2E2E2] bg-white px-3 py-3 shadow-sm">
      <View className="flex-row items-start">
        <View className="mr-2 h-10 w-10 items-center justify-center rounded-full bg-[#E5E5E5]">
          <Ionicons name="person" size={21} color="#A3A3A3" />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-extrabold text-[#1D1D1D]">Juan dela cruz</Text>
            <Text className="text-xs text-[#6A97C6]">19mins ago</Text>
          </View>

          <View className="mt-1 flex-row gap-1">
            <Tag text="Emergency" className="bg-[#DC2626]" />
            <Tag text="Panic" className="bg-[#7F1D1D]" />
          </View>

          <Text className="mt-2 pr-1 text-xs leading-4 text-[#222]">
            HELP!!! The system deleted all my files and I need them NOW!!! Please fix this immediately!!
          </Text>

          <View className="mt-2 flex-row items-center justify-end gap-1">
            <Ionicons name="location-outline" size={13} color="#A0A0A0" />
            <Text className="text-xs text-[#A0A0A0]">Sto Tomas</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
