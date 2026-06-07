import React from "react";
import { Text, View, Pressable, ActivityIndicator } from "react-native";
import {
  MyReportsList,
  ReportsFeedSkeleton,
  SectionTitle,
  MyReportsTopBar,
  useMyReports,
} from "../../modules/myReports";
import { RefreshableScrollView, usePullToRefresh, Colors } from "../../modules/shared";
import { AuthCityFooter } from "../../modules/auth";

export default function MyReportsScreen() {
  const {
    reports,
    total,
    reloadMyReports,
    isInitialLoading,
    isLoadingMore,
    hasMore,
    loadMore,
  } = useMyReports();
  const [deletingId, setDeletingId] = React.useState(null);
  const { refreshing, onRefresh } = usePullToRefresh(reloadMyReports);

  const handleDelete = async (reportId) => {
    setDeletingId(reportId);
    try {
      await require("../../services/reports").reportsApi.deleteReport(reportId);
      await reloadMyReports();
    } catch (err) {
      alert(err?.message || "Failed to delete report.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.screen.tabs }}>
      <AuthCityFooter backgroundColor={Colors.screen.tabs} />

      <MyReportsTopBar />

      <RefreshableScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-44 pt-4"
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        {isInitialLoading ? (
          <ReportsFeedSkeleton />
        ) : (
          <>
            <SectionTitle title="My Submitted Reports" />
            <Text className="mb-3 text-sm" style={{ color: Colors.text.secondary }}>
              Track the status and details of every concern you have submitted.
            </Text>

            <MyReportsList reports={reports} onDelete={handleDelete} deletingId={deletingId} />

            {hasMore && (
              <View className="my-5 pb-10 items-center">
                <Pressable
                  onPress={loadMore}
                  disabled={isLoadingMore}
                  className="w-full rounded-xl border py-3 items-center justify-center flex-row gap-2"
                  style={{
                    borderColor: Colors.borderMuted || Colors.border,
                    backgroundColor: Colors.background || "#ffffff",
                  }}
                >
                  {isLoadingMore ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Text className="text-sm font-bold" style={{ color: Colors.primary }}>
                      Load More Reports ({reports.length} of {total})
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

            {!hasMore && reports.length > 0 && (
              <Text className="my-5 pb-10 text-center text-sm font-bold" style={{ color: Colors.text.slate || Colors.text.secondary }}>
                Showing all {total} reports
              </Text>
            )}
          </>
        )}
      </RefreshableScrollView>
    </View>
  );
}
