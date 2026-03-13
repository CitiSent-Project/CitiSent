import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MyReportsList from "../../components/myReports/MyReportsList";
import ReportsFeedSkeleton from "../../components/myReports/ReportsFeedSkeleton";
import SectionTitle from "../../components/myReports/SectionTitle";
import StatusFilterChips from "../../components/myReports/StatusFilterChips";
import MyReportsTopBar from "../../components/myReports/MyReportsTopBar";
import RefreshableScrollView from "../../components/ui/RefreshableScrollView";
import useMyReports from "../../hooks/useMyReports";
import usePullToRefresh from "../../hooks/usePullToRefresh";

export default function MyReportsScreen() {
  const insets = useSafeAreaInsets();
  const {
    selectedStatus,
    setSelectedStatus,
    filteredReports,
    reloadMyReports,
    isInitialLoading,
  } = useMyReports();

  const { refreshing, onRefresh } = usePullToRefresh(reloadMyReports);

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
        {isInitialLoading ? (
          <ReportsFeedSkeleton />
        ) : (
          <>
            <SectionTitle title="My Submitted Reports" />
            <Text className="mb-3 text-sm text-[#64748B]">
              Track the status and details of every concern you have submitted.
            </Text>

            <StatusFilterChips selectedStatus={selectedStatus} onSelectStatus={setSelectedStatus} />

            <MyReportsList reports={filteredReports} />
          </>
        )}
      </RefreshableScrollView>
    </View>
  );
}
