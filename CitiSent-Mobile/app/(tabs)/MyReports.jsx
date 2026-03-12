import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MyReportsList from "../../components/myReports/MyReportsList";
import SectionTitle from "../../components/myReports/SectionTitle";
import MyReportsTopBar from "../../components/myReports/MyReportsTopBar";
import RefreshableScrollView from "../../components/ui/RefreshableScrollView";
import usePullToRefresh from "../../hooks/usePullToRefresh";
import { reportsApi } from "../../services/reports";

export default function MyReportsScreen() {
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState([]);

  const loadMyReports = useCallback(async () => {
    const nextReports = await reportsApi.getMyReports();
    setReports(Array.isArray(nextReports) ? nextReports : []);
  }, []);

  const { refreshing, onRefresh } = usePullToRefresh(loadMyReports);

  useEffect(() => {
    loadMyReports();
  }, [loadMyReports]);

  return (
    <View className="flex-1 bg-[#ECECEC]" style={{ paddingTop: insets.top }}>
      <MyReportsTopBar />

      <RefreshableScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-8 pt-4"
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        <SectionTitle title="My Submitted Reports" />
        <Text className="mb-3 text-sm text-[#64748B]">
          Track the status and details of every concern you have submitted.
        </Text>

        <MyReportsList reports={reports} />
      </RefreshableScrollView>
    </View>
  );
}
