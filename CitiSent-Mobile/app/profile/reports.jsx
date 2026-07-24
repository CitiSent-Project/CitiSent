
import { useMemo, useState, useEffect } from "react";
import { Pressable, Text, View, ActivityIndicator } from "react-native";
import { MyReportCard, useMyReports } from "../../modules/myReports";
import { EditReportSheet, ProfileSubpageLayout } from "../../modules/profile";
import { usePullToRefresh, Colors } from "../../modules/shared";
import { reportsApi } from "../../services/reports";
import FeedbackModal from "../../components/ui/FeedbackModal";
import ReportDiscussionModal from "../../components/myReports/ReportDiscussionModal";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "unresolved", label: "Unresolved" },
];

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase();
}

export default function ReportsMadePage() {

  const [selectedStatus, setSelectedStatus] = useState("all");
  const [editingReportId, setEditingReportId] = useState(null);
  const [discussionReport, setDiscussionReport] = useState(null);
  
  // Feedback modal state
  const [feedback, setFeedback] = useState({ visible: false, type: "info", title: "", message: "" });

  // Use the custom hook to fetch user's reports with database-level pagination & filtering
  const {
    reports,
    total,
    reloadMyReports,
    isInitialLoading,
    isLoadingMore,
    hasMore,
    loadMore,
  } = useMyReports(selectedStatus);

  // Pull to refresh uses the reload function from the hook
  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    setSelectedStatus("all");
    await reloadMyReports();
  });

  // Fetch all counts on load/refresh
  const [counts, setCounts] = useState({ pending: 0, inProgress: 0, completed: 0, unresolved: 0 });
  useEffect(() => {
    async function fetchCounts() {
      try {
        const result = await reportsApi.getMyReportCounts();
        setCounts(result);
      } catch (err) {
        console.warn("Failed to fetch counts:", err);
      }
    }
    fetchCounts();
  }, [reports]);

  const editingReport = reports.find((item) => item.id === editingReportId) || null;

  // When saving, close the edit modal and perform api call
  const handleSaveReport = async (updatedData) => {
    if (!editingReportId) return;

    try {
      await reportsApi.updateReport(editingReportId, updatedData);
      setEditingReportId(null);
      await reloadMyReports();
      
      setFeedback({
        visible: true,
        type: "success",
        title: "Success!",
        message: "Your report has been successfully updated.",
      });
    } catch (error) {
      setFeedback({
        visible: true,
        type: "error",
        title: "Error",
        message: "Failed to save the report. Please try again.",
      });
      throw error;
    }
  };

  return (
    <ProfileSubpageLayout title="Manage Reports" refreshing={refreshing} onRefresh={onRefresh}>
      <View
        className="mb-4 rounded-2xl border px-4 py-4"
        style={{ borderColor: Colors.ui.infoSurfaceBorder, backgroundColor: Colors.ui.infoSurface }}
      >
        <Text className="text-sm font-semibold" style={{ color: Colors.text.infoHeading }}>Your submissions overview</Text>
        <Text className="mt-1 text-xs" style={{ color: Colors.text.link }}>Pull down anytime to refresh this list.</Text>

        <View className="mt-4 flex-row gap-2">
          <View className="flex-1 rounded-xl px-3 py-3" style={{ backgroundColor: Colors.background }}>
            <Text className="text-xl font-extrabold" style={{ color: Colors.text.heading }}>{counts.pending}</Text>
            <Text className="text-xs font-semibold" style={{ color: Colors.text.secondary }}>Pending</Text>
          </View>
          <View className="flex-1 rounded-xl px-3 py-3" style={{ backgroundColor: Colors.background }}>
            <Text className="text-xl font-extrabold" style={{ color: Colors.text.heading }}>{counts.inProgress}</Text>
            <Text className="text-xs font-semibold" style={{ color: Colors.text.secondary }}>In Progress</Text>
          </View>
          <View className="flex-1 rounded-xl px-3 py-3" style={{ backgroundColor: Colors.background }}>
            <Text className="text-xl font-extrabold" style={{ color: Colors.text.heading }}>{counts.completed}</Text>
            <Text className="text-xs font-semibold" style={{ color: Colors.text.secondary }}>Completed</Text>
          </View>
          <View className="flex-1 rounded-xl px-3 py-3" style={{ backgroundColor: Colors.background }}>
            <Text className="text-xl font-extrabold" style={{ color: Colors.text.heading }}>{counts.unresolved}</Text>
            <Text className="text-xs font-semibold" style={{ color: Colors.text.secondary }}>Unresolved</Text>
          </View>
        </View>
      </View>

      <View className="mb-4 flex-row flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => {
          const active = selectedStatus === filter.key;

          return (
            <Pressable
              key={filter.key}
              onPress={() => setSelectedStatus(filter.key)}
              className="rounded-full border px-4 py-2"
              style={{
                borderColor: active ? Colors.primaryStrong : Colors.borderMuted,
                backgroundColor: active ? Colors.primaryStrong : Colors.background,
              }}
            >
              <Text className="text-xs font-bold" style={{ color: active ? Colors.text.inverse : Colors.text.body }}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {reports.length > 0 ? (
        <>
          {reports.map((report) => (
            <View key={report.id}>
              <MyReportCard
                report={report}
                containerClassName="mb-2"
                onOpenDiscussion={(rep) => setDiscussionReport(rep)}
              />
              <View className="mb-4 flex-row justify-end">
                {normalizeStatus(report.status) === "pending" ? (
                  <Pressable
                    onPress={() => setEditingReportId(report.id)}
                    className="rounded-lg border px-3 py-2"
                    style={{ borderColor: Colors.ui.infoSurfaceBorderStrong, backgroundColor: Colors.ui.infoSurface }}
                  >
                    <Text className="text-xs font-bold" style={{ color: Colors.primaryStrong }}>Edit Report</Text>
                  </Pressable>
                ) : (
                  <Text className="text-xs italic" style={{ color: Colors.text.secondary }}>
                    This report can no longer be edited because it has already been reviewed by an administrator.
                  </Text>
                )}
              </View>
            </View>
          ))}

          {hasMore && (
            <View className="my-5 pb-10 items-center">
              <Pressable
                onPress={loadMore}
                disabled={isLoadingMore}
                className="w-full rounded-xl border py-3 items-center justify-center flex-row gap-2"
                style={{
                  borderColor: Colors.borderMuted,
                  backgroundColor: Colors.background,
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
      ) : (
        <View className="rounded-2xl border px-4 py-8" style={{ borderColor: Colors.borderSoft, backgroundColor: Colors.background }}>
          <Text className="text-center text-sm font-semibold" style={{ color: Colors.text.bodySoft }}>No reports for this status yet.</Text>
        </View>
      )}

      <EditReportSheet
        visible={Boolean(editingReport)}
        report={editingReport}
        onClose={() => setEditingReportId(null)}
        onSave={handleSaveReport}
      />

      <ReportDiscussionModal
        visible={Boolean(discussionReport)}
        report={discussionReport}
        onClose={() => setDiscussionReport(null)}
      />

      <FeedbackModal
        visible={feedback.visible}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        onClose={() => setFeedback({ ...feedback, visible: false })}
      />
    </ProfileSubpageLayout>
  );
}
