
import { useState, useEffect, useRef } from "react";
import { Pressable, Text, View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MyReportCard, useMyReports, ReportsFeedSkeleton } from "../../modules/myReports";
import { EditReportSheet, ProfileSubpageLayout } from "../../modules/profile";
import { usePullToRefresh, Colors } from "../../modules/shared";
import { reportsApi } from "../../services/reports";
import FeedbackModal from "../../components/ui/FeedbackModal";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import ReportDiscussionModal from "../../components/myReports/ReportDiscussionModal";
import { getAuthUser } from "../../services/authSession";
import { useAdminMessageState } from "../../contexts/AdminMessageContext";

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

function normalizeFilterStatus(status) {
  const s = String(status || "").trim().toLowerCase();
  if (s === "pending") return "pending";
  if (s === "in progress" || s === "in_review") return "in progress";
  if (s === "completed" || s === "resolved") return "completed";
  if (s === "unresolved" || s === "rejected") return "unresolved";
  return s;
}

export default function ReportsMadePage() {

  const [selectedStatus, setSelectedStatus] = useState("all");
  const [editingReportId, setEditingReportId] = useState(null);
  const [discussionReport, setDiscussionReport] = useState(null);

  // Delete state
  const [confirmDeleteReport, setConfirmDeleteReport] = useState(null);
  const [deletingReportId, setDeletingReportId] = useState(null);

  // Shared real-time notification state — single source of truth
  const {
    hasUnreadAdminMessage,
    unreadByReport,
    statusByReport,
    setReportRead,
    registerReportStatuses,
    seedUnreadState,
    refreshUnreadSummary,
  } = useAdminMessageState();

  const discussionReportRef = useRef(discussionReport);
  useEffect(() => {
    discussionReportRef.current = discussionReport;
  }, [discussionReport]);

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

  // Fetch all counts on load/refresh
  const [counts, setCounts] = useState({ pending: 0, inProgress: 0, completed: 0, unresolved: 0 });

  const fetchCounts = async () => {
    try {
      const result = await reportsApi.getMyReportCounts();
      setCounts(result);
    } catch (err) {
      console.warn("Failed to fetch counts:", err);
    }
  };

  useEffect(() => {
    fetchCounts();
    refreshUnreadSummary?.().catch(() => {});
  }, []);

  // Pull to refresh uses the reload function from the hook
  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    setSelectedStatus("all");
    await Promise.all([reloadMyReports(), fetchCounts(), refreshUnreadSummary?.().catch(() => {})]);
  });

  const editingReport = reports.find((item) => item.id === editingReportId) || null;

  // Register report statuses & unread flags in shared store for instant filter badge correlation
  useEffect(() => {
    if (reports.length > 0) {
      registerReportStatuses(reports);
      const unreadMap = {};
      for (const r of reports) {
        if (r.hasUnreadAdminMessage !== undefined) {
          unreadMap[String(r.id)] = Boolean(r.hasUnreadAdminMessage);
        }
      }
      if (Object.keys(unreadMap).length > 0) {
        seedUnreadState(unreadMap, false);
      }
    }
  }, [reports]);

  /**
   * Determine whether a specific filter category has unread admin messages.
   */
  const isFilterUnread = (filterKey) => {
    if (filterKey === "all") {
      return Boolean(hasUnreadAdminMessage);
    }
    const targetKey = normalizeFilterStatus(filterKey);
    return Object.entries(unreadByReport).some(([repId, isUnread]) => {
      if (!isUnread) return false;
      const status = statusByReport[repId] || reports.find((r) => String(r.id) === String(repId))?.status;
      return normalizeFilterStatus(status) === targetKey;
    });
  };

  /**
   * Immediately clear the badge for a specific report in the shared store.
   * Called by the modal's onMarkRead prop the moment the chat opens.
   */
  const handleMarkRead = (reportId) => {
    setReportRead(reportId);
  };

  /**
   * Discussion modal close handler.
   */
  const handleDiscussionClose = () => {
    setDiscussionReport(null);
  };

  // When saving, close the edit modal and perform api call
  const handleSaveReport = async (updatedData) => {
    if (!editingReportId) return;

    try {
      await reportsApi.updateReport(editingReportId, updatedData);
      setEditingReportId(null);
      await Promise.all([reloadMyReports(), fetchCounts()]);
      
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

  /**
   * Opens the delete confirmation modal for the given report.
   */
  const handleDeleteRequest = (report) => {
    setConfirmDeleteReport(report);
  };

  /**
   * Cancels the delete — dismisses the confirmation modal without any change.
   */
  const handleDeleteCancel = () => {
    setConfirmDeleteReport(null);
  };

  /**
   * Confirmed delete: calls the API, optimistically removes the report from
   * the local list, then refreshes counts. Shows an error modal on failure.
   * The button is disabled while deletingReportId is set to prevent double-taps.
   */
  const handleDeleteConfirm = async () => {
    if (!confirmDeleteReport) return;
    const reportId = confirmDeleteReport.id;
    setDeletingReportId(reportId);
    setConfirmDeleteReport(null);

    try {
      await reportsApi.deleteReport(reportId);
      // Optimistically remove from list immediately
      await reloadMyReports();
      await fetchCounts();
    } catch (err) {
      setFeedback({
        visible: true,
        type: "error",
        title: "Delete Failed",
        message: err?.message || "Report was not deleted. Please try again.",
      });
    } finally {
      setDeletingReportId(null);
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
          const hasUnread = isFilterUnread(filter.key);

          return (
            <View key={filter.key} className="relative">
              <Pressable
                onPress={() => setSelectedStatus(filter.key)}
                className="rounded-full border px-4 py-2"
                style={{
                  borderColor: active ? Colors.primaryStrong : Colors.borderMuted,
                  backgroundColor: active ? Colors.primaryStrong : Colors.background,
                }}
              >
                <Text className="text-xs font-bold" style={{ color: active ? Colors.text.inverse : Colors.text.body }}>{filter.label}</Text>
              </Pressable>
              {hasUnread && (
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    width: 9,
                    height: 9,
                    borderRadius: 4.5,
                    backgroundColor: Colors.error ?? "#ef4444",
                    borderWidth: 1.5,
                    borderColor: Colors.background ?? "#ffffff",
                  }}
                />
              )}
            </View>
          );
        })}
      </View>

      {isInitialLoading ? (
        <ReportsFeedSkeleton />
      ) : reports.length > 0 ? (
        <>
          {reports.map((report) => (
              <View key={report.id} className="mb-4">
                <MyReportCard
                  report={report}
                  containerClassName="mb-2"
                  hasUnreadAdminMessage={Boolean(unreadByReport[String(report.id)])}
                  onOpenDiscussion={(rep) => {
                    setDiscussionReport(rep);
                  }}
                />
                <View className="mb-0 flex-row justify-between items-center gap-2">
                  {normalizeStatus(report.status) === "pending" ? (
                    <Pressable
                      onPress={() => setEditingReportId(report.id)}
                      className="rounded-lg border px-3 py-2"
                      style={{ borderColor: Colors.ui.infoSurfaceBorderStrong, backgroundColor: Colors.ui.infoSurface }}
                    >
                      <Text className="text-xs font-bold" style={{ color: Colors.primaryStrong }}>Edit Report</Text>
                    </Pressable>
                  ) : (
                    <Text className="flex-1 text-xs italic" style={{ color: Colors.text.secondary }}>
                      This report can no longer be edited because it has already been reviewed by an administrator.
                    </Text>
                  )}

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Delete report"
                    onPress={() => handleDeleteRequest(report)}
                    disabled={deletingReportId === report.id}
                    className="flex-row items-center rounded-lg px-3 py-2"
                    style={{
                      backgroundColor: Colors.ui.errorSurface,
                      opacity: deletingReportId === report.id ? 0.5 : 1,
                    }}
                  >
                    {deletingReportId === report.id ? (
                      <ActivityIndicator size="small" color={Colors.error} />
                    ) : (
                      <Ionicons name="trash-outline" size={14} color={Colors.error} />
                    )}
                    <Text className="ml-1 text-xs font-semibold" style={{ color: Colors.error }}>
                      {deletingReportId === report.id ? "Deleting..." : "Delete"}
                    </Text>
                  </Pressable>
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
        onClose={handleDiscussionClose}
        onMarkRead={handleMarkRead}
      />

      <ConfirmationModal
        visible={Boolean(confirmDeleteReport)}
        type="danger"
        title="Delete Report?"
        message="Are you sure you want to delete this report? This action cannot be undone."
        cancelText="Cancel"
        confirmText="Delete"
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
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
