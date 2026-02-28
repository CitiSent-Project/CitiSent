import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { TouchableOpacity, View } from "react-native";

const tabs = [
  { key: "list", icon: (active) => <Ionicons name="menu" size={28} color={active ? "#274268" : "#5E738F"} /> },
  { key: "map", icon: (active) => <MaterialCommunityIcons name="map-marker-outline" size={28} color={active ? "#274268" : "#5E738F"} /> },
  { key: "gallery", icon: (active) => <Ionicons name="images-outline" size={26} color={active ? "#274268" : "#5E738F"} /> },
];

export default function NearbyViewTabs({ activeTab = "list", onTabChange }) {
  return (
    <View className="bg-[#F5F3F6] px-3 pt-1">
      <View className="flex-row items-center">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.7}
              onPress={() => onTabChange?.(tab.key)}
              className={`flex-1 items-center pb-1 pt-2 border-b-[3px] ${
                isActive ? "border-[#274268]" : "border-transparent"
              }`}
            >
              {tab.icon(isActive)}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
