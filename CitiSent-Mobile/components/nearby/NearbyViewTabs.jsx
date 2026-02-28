import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { TouchableOpacity, View } from "react-native";

const tabs = [
  { key: "list", icon: (active) => <Ionicons name="menu" size={28} color={active ? "#223D68" : "#9CA3AF"} /> },
  { key: "map", icon: (active) => <MaterialCommunityIcons name="map-marker-outline" size={28} color={active ? "#223D68" : "#9CA3AF"} /> },
  { key: "gallery", icon: (active) => <Ionicons name="images-outline" size={26} color={active ? "#223D68" : "#9CA3AF"} /> },
];

export default function NearbyViewTabs({ activeTab = "list", onTabChange }) {
  return (
    <View className="bg-[#F5F3F6] px-3 pt-2">
      <View className="flex-row items-center">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.7}
              onPress={() => onTabChange?.(tab.key)}
              className="flex-1 items-center pb-2"
            >
              {tab.icon(isActive)}
              {isActive && <View className="mt-1 h-[2.5px] w-10 rounded-full bg-[#223D68]" />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
