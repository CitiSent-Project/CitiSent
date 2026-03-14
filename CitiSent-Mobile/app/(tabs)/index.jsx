import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import EmergencyServicesRow from "../../components/home/EmergencyServicesRow";
import HomeHeader from "../../components/home/HomeHeader";
import HomeHero from "../../components/home/HomeHero";
import LatestReportCard from "../../components/home/LatestReportCard";
import SectionHeader from "../../components/home/SectionHeader";
import RefreshableScrollView from "../../components/ui/RefreshableScrollView";
import usePullToRefresh from "../../hooks/usePullToRefresh";
import { reportsApi } from "../../services/reports";
import AuthCityFooter from "../../components/auth/AuthCityFooter";

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
    <View className="flex-1 bg-[#ECECEC]" style={{ paddingTop: insets.top }}>
      <RefreshableScrollView
        className="flex-1"
        contentContainerClassName="pb-8"
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
      <AuthCityFooter />
    </View>
  );
}
