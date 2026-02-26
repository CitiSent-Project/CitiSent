import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EmergencyServicesRow from "../../components/home/EmergencyServicesRow";
import HomeHeader from "../../components/home/HomeHeader";
import HomeHero from "../../components/home/HomeHero";
import LatestReportCard from "../../components/home/LatestReportCard";
import NewsCard from "../../components/home/NewsCard";
import SectionHeader from "../../components/home/SectionHeader";

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#ECECEC]" edges={["top"]}>
      <HomeHeader />
      <HomeHero />

      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-8 pt-3">
        <SectionHeader title="Emergency Hotlines" />
        <EmergencyServicesRow />

        <SectionHeader title="Latest Reports" />
        <LatestReportCard />

        <SectionHeader title="Tomasino News" />
        <NewsCard />

        <View className="h-5" />
      </ScrollView>
    </SafeAreaView>
  );
}
