import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
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
    <View className="flex-1" style={{ paddingTop: insets.top, backgroundColor: Colors.screen.tabs }}>
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

            <SectionHeader title="Latest Reports" />
            <LatestReportCard report={latestReport ?? undefined} />

            <View className="h-5" />
          </View>
        </View>
      </RefreshableScrollView>
    </View>
  );
}
