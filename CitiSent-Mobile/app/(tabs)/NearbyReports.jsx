import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PriorityChips from "../../components/myReports/PriorityChips";
import ReportCard from "../../components/myReports/ReportCard";
import ReportsFeedSkeleton from "../../components/myReports/ReportsFeedSkeleton";
import SectionTitle from "../../components/myReports/SectionTitle";
import PageTopBar from "../../components/layout/PageTopBar";
import RefreshableScrollView from "../../components/ui/RefreshableScrollView";
import usePullToRefresh from "../../hooks/usePullToRefresh";
import { reportsApi } from "../../services/reports";

export default function NearbyReportsScreen() {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [latestNearbyReports, setLatestNearbyReports] = useState([]);
  const [otherNearbyReports, setOtherNearbyReports] = useState([]);

  const reloadReports = useCallback(async () => {
    setSelectedPriority("all");
    setIsLoading(true);

    const response = await reportsApi.getNearbyReports();
    setLatestNearbyReports(Array.isArray(response.latestReports) ? response.latestReports : []);
    setOtherNearbyReports(Array.isArray(response.otherReports) ? response.otherReports : []);
    setIsLoading(false);
  }, []);

  const { refreshing, onRefresh } = usePullToRefresh(reloadReports);

  useEffect(() => {
    reloadReports();
  }, [reloadReports]);

  useFocusEffect(
    useCallback(() => {
      setSelectedPriority("all");
    }, [])
  );

  const filteredOtherReports = useMemo(() => {
    if (selectedPriority === "all") {
      return otherNearbyReports;
    }

    return otherNearbyReports.filter((report) => report.priority === selectedPriority);
  }, [selectedPriority]);

  return (
    <View className="flex-1 bg-[#ECECEC]" style={{ paddingTop: insets.top }}>
      <PageTopBar title="All Reports" />
      <RefreshableScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-8 pt-4"
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        {isLoading ? (
          <ReportsFeedSkeleton />
        ) : (
          <>
            <SectionTitle title="Latest Reports" />
            {latestNearbyReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}

            <SectionTitle title="Other Reports" />
            <PriorityChips selectedPriority={selectedPriority} onSelectPriority={setSelectedPriority} />

            {filteredOtherReports.length > 0 ? (
              filteredOtherReports.map((report) => <ReportCard key={report.id} report={report} />)
            ) : (
              <View className="mb-4 rounded-2xl border border-[#E2E2E2] bg-white px-4 py-5">
                <Text className="text-center text-sm font-semibold text-[#4B5563]">
                  No reports found for this priority.
                </Text>
              </View>
            )}
          </>
        )}
      </RefreshableScrollView>
    </View>
  );
}
