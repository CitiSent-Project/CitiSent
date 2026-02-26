import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

const hotlines = [
  {
    key: "natl-emergency",
    name: "National Emergency Hotline",
    number: "911",
    icon: <Ionicons name="call" size={20} color="#0EA5E9" />,
  },
  {
    key: "pnp",
    name: "Philippine National Police",
    number: "117",
    icon: <MaterialCommunityIcons name="police-badge" size={20} color="#1D4ED8" />,
  },
  {
    key: "bfp",
    name: "Bureau of Fire Protection",
    number: "(02) 8426 0219",
    icon: <MaterialCommunityIcons name="fire-truck" size={20} color="#DC2626" />,
  },
];

export default function EmergencyServicesRow() {
  return (
    <View className="mb-6 gap-2">
      {hotlines.map((hotline) => (
        <View
          key={hotline.key}
          className="flex-row items-center rounded-2xl border border-[#DFDFDF] bg-white px-3 py-3"
        >
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-[#EAF3FF]">
            {hotline.icon}
          </View>

          <View className="flex-1">
            <Text className="text-sm font-bold text-[#1F2937]">{hotline.name}</Text>
            <Text className="mt-0.5 text-sm font-semibold text-[#223D68]">{hotline.number}</Text>
          </View>

          <Ionicons name="call-outline" size={18} color="#94A3B8" />
        </View>
      ))}
    </View>
  );
}
