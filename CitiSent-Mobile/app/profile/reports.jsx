import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import MyReportCard from "../../components/myReports/reportItem/MyReportCard";
import EditReportSheet from "../../components/profile/reports/EditReportSheet";
import ProfileSubpageLayout from "../../components/profile/ProfileSubpageLayout";
import usePullToRefresh from "../../hooks/usePullToRefresh";
import { MY_REPORTS } from "../../constants/myReportsData";
import { Colors } from "../../constants/colors";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase();
}

export default function ReportsMadePage() {
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [reports, setReports] = useState(MY_REPORTS);
  const [editingReportId, setEditingReportId] = useState(null);

  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    setSelectedStatus("all");
    setReports(MY_REPORTS);
  });

  const filteredReports = useMemo(() => {
    if (selectedStatus === "all") {
      return reports;
    }

    return reports.filter((report) => normalizeStatus(report.status) === selectedStatus);
  }, [reports, selectedStatus]);

  const pendingCount = reports.filter((report) => normalizeStatus(report.status) === "pending").length;
  const inProgressCount = reports.filter((report) => normalizeStatus(report.status) === "in progress").length;
  const completedCount = reports.filter((report) => normalizeStatus(report.status) === "completed").length;

  const editingReport = reports.find((item) => item.id === editingReportId) || null;

  const handleSaveReport = (updates) => {
    setReports((prev) => prev.map((item) => (item.id === editingReportId ? { ...item, ...updates } : item)));
    setEditingReportId(null);
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
            <Text className="text-xl font-extrabold" style={{ color: Colors.text.heading }}>{pendingCount}</Text>
            <Text className="text-xs font-semibold" style={{ color: Colors.text.secondary }}>Pending</Text>
          </View>
          <View className="flex-1 rounded-xl px-3 py-3" style={{ backgroundColor: Colors.background }}>
            <Text className="text-xl font-extrabold" style={{ color: Colors.text.heading }}>{inProgressCount}</Text>
            <Text className="text-xs font-semibold" style={{ color: Colors.text.secondary }}>In Progress</Text>
          </View>
          <View className="flex-1 rounded-xl px-3 py-3" style={{ backgroundColor: Colors.background }}>
            <Text className="text-xl font-extrabold" style={{ color: Colors.text.heading }}>{completedCount}</Text>
            <Text className="text-xs font-semibold" style={{ color: Colors.text.secondary }}>Completed</Text>
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

      {filteredReports.length > 0 ? (
        filteredReports.map((report) => (
          <View key={report.id}>
            <MyReportCard report={report} containerClassName="mb-2" />
            <View className="mb-4 flex-row justify-end">
              <Pressable
                onPress={() => setEditingReportId(report.id)}
                className="rounded-lg border px-3 py-2"
                style={{ borderColor: Colors.ui.infoSurfaceBorderStrong, backgroundColor: Colors.ui.infoSurface }}
              >
                <Text className="text-xs font-bold" style={{ color: Colors.primaryStrong }}>Edit Report</Text>
              </Pressable>
            </View>
          </View>
        ))
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
    </ProfileSubpageLayout>
  );
}
