import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NearbyGalleryView from "../../components/nearby/nearbyViewTabs/NearbyGalleryView";
import NearbyMapView from "../../components/nearby/nearbyViewTabs/NearbyMapView";
import NearbyReportRow from "../../components/nearby/NearbyReportRow";
import NearbyTopBar from "../../components/nearby/NearbyTopBar";
import NearbyViewTabs from "../../components/nearby/nearbyViewTabs/NearbyViewTabs";

const nearbyReports = [
  {
    id: "1",
    title: "Fallen Tree",
    address: "Wissahickon Bike Trail",
    status: "COMPLETED",
    time: "6 hr. ago",
    notes: 0,
    comments: 3,
    imageFile: require("../../assets/createReportLogo/PWD.png"),
  },
  {
    id: "2",
    title: "Illegal Dumping",
    address: "517 Poplar Street",
    status: "IN PROGRESS",
    time: "6 hr. ago",
    notes: 0,
    comments: 1,
    imageFile: require("../../assets/PublicAgencies/cityhall.png"),
  },
  {
    id: "3",
    title: "Graffiti Removal",
    address: "530 South 5th Street",
    status: "IN PROGRESS",
    time: "6 hr. ago",
    notes: 0,
    comments: 0,
    imageFile: require("../../assets/PublicAgencies/cityhall.png"),
  },
  {
    id: "4",
    title: "Graffiti Removal",
    address: "501-505  Kater Street",
    status: "IN PROGRESS",
    time: "6 hr. ago",
    notes: 0,
    comments: 0,
    imageFile: require("../../assets/PublicAgencies/cityhall.png"),
  },
  {
    id: "5",
    title: "Vacant House",
    address: "5727  N Mascher St",
    status: "IN PROGRESS",
    time: "6 hr. ago",
    notes: 0,
    comments: 0,
    imageFile: require("../../assets/PublicAgencies/cityhall.png"),
  },
];

export default function NearbyReportsScreen() {
  const [activeTab, setActiveTab] = useState("list");
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <NearbyTopBar />
      <NearbyViewTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "list" && (
        <ScrollView className="flex-1" contentContainerClassName="px-3 pb-16">
          {nearbyReports.map((report) => (
            <NearbyReportRow key={report.id} report={report} />
          ))}
          <View className="h-3" />
        </ScrollView>
      )}

      {activeTab === "map" && <NearbyMapView />}
      {activeTab === "gallery" && <NearbyGalleryView />}
    </View>
  );
}
