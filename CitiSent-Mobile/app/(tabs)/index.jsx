import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import EmergencyServicesRow from "../../components/home/EmergencyServicesRow";
import HomeHeader from "../../components/home/HomeHeader";
import HomeHero from "../../components/home/HomeHero";
import LatestReportCard from "../../components/home/LatestReportCard";
import NewsCard from "../../components/home/NewsCard";
import SectionHeader from "../../components/home/SectionHeader";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#ECECEC]" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        <HomeHeader />

        <View className="pt-3">
          <HomeHero />

          <View className="px-4">
            <SectionHeader title="Emergency Hotlines" />
            <EmergencyServicesRow />

            <SectionHeader title="Latest Reports" />
            <LatestReportCard />

            <View className="h-5" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
