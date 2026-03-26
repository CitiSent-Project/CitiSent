import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import {
  EmergencyServicesRow,
  HomeHeader,
  HomeHero,
  LatestReportCard,
  SectionHeader,
  reportsApi,
} from "../../modules/home";
import { RefreshableScrollView, usePullToRefresh, Colors } from "../../modules/shared";
import { AuthCityFooter } from "../../modules/auth";
import YourLatestReportSection from "../../components/home/YourLatestReportSection";

export default function HomeScreen() {
  const [latestReport, setLatestReport] = useState(null);

  const loadLatestReport = useCallback(async () => {
    const report = await reportsApi.getLatestHomeReport();
    setLatestReport(report);
  }, []);

  const { refreshing, onRefresh } = usePullToRefresh(loadLatestReport);

  useEffect(() => {
    loadLatestReport();
  }, [loadLatestReport]);

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.screen.tabs }}>
      <AuthCityFooter backgroundColor={Colors.screen.tabs} />

      <RefreshableScrollView
        className="flex-1"
        contentContainerClassName="pb-44"
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        <HomeHeader />

        <View className="pt-3">
          <HomeHero />

          <View className="px-4">
            <SectionHeader title="Emergency Hotlines" />
            <EmergencyServicesRow />

            <YourLatestReportSection title="Your Latest Report(s)" />
            <LatestReportCard report={latestReport ?? undefined} />

            <View className="h-5" />
          </View>
        </View>
      </RefreshableScrollView>
    </View>
  );
}
