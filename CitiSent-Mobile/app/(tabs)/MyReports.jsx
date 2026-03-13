import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MyReportsList from "../../components/myReports/MyReportsList";
import SectionTitle from "../../components/myReports/SectionTitle";
import MyReportsTopBar from "../../components/myReports/MyReportsTopBar";
import RefreshableScrollView from "../../components/ui/RefreshableScrollView";
import usePullToRefresh from "../../hooks/usePullToRefresh";
import { reportsApi } from "../../services/reports";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase();
}

export default function MyReportsScreen() {
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("all");

  const loadMyReports = useCallback(async () => {
    const nextReports = await reportsApi.getMyReports();
    setReports(Array.isArray(nextReports) ? nextReports : []);
  }, []);

  const reloadMyReports = useCallback(async () => {
    setSelectedStatus("all");
    await loadMyReports();
  }, [loadMyReports]);

  const filteredReports = useMemo(() => {
    if (selectedStatus === "all") {
      return reports;
    }

    return reports.filter((report) => normalizeStatus(report.status) === selectedStatus);
  }, [reports, selectedStatus]);

  const { refreshing, onRefresh } = usePullToRefresh(reloadMyReports);

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

        <View className="mb-4 flex-row flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => {
            const active = selectedStatus === filter.key;

            return (
              <Pressable
                key={filter.key}
                onPress={() => setSelectedStatus(filter.key)}
                className={`rounded-full border px-4 py-2 ${active ? "border-[#1D4ED8] bg-[#1D4ED8]" : "border-[#CBD5E1] bg-white"}`}
              >
                <Text className={`text-xs font-bold ${active ? "text-white" : "text-[#334155]"}`}>{filter.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <MyReportsList reports={filteredReports} />
      </RefreshableScrollView>
    </View>
  );
}
