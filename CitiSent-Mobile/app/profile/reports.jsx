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
        <Text className="text-sm font-semibold text-[#1E3A8A]">Your submissions overview</Text>
        <Text className="mt-1 text-xs text-[#1E40AF]">Pull down anytime to refresh this list.</Text>

        <View className="mt-4 flex-row gap-2">
          <View className="flex-1 rounded-xl bg-white px-3 py-3">
            <Text className="text-xl font-extrabold text-[#0F172A]">{pendingCount}</Text>
            <Text className="text-xs font-semibold text-[#64748B]">Pending</Text>
          </View>
          <View className="flex-1 rounded-xl bg-white px-3 py-3">
            <Text className="text-xl font-extrabold text-[#0F172A]">{inProgressCount}</Text>
            <Text className="text-xs font-semibold text-[#64748B]">In Progress</Text>
          </View>
          <View className="flex-1 rounded-xl bg-white px-3 py-3">
            <Text className="text-xl font-extrabold text-[#0F172A]">{completedCount}</Text>
            <Text className="text-xs font-semibold text-[#64748B]">Completed</Text>
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
              className={`rounded-full border px-4 py-2 ${active ? "border-[#1D4ED8]" : "border-[#CBD5E1] bg-white"}`}
              style={active ? { backgroundColor: Colors.primaryStrong } : undefined}
            >
              <Text className={`text-xs font-bold ${active ? "text-white" : "text-[#334155]"}`}>{filter.label}</Text>
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
                <Text className="text-xs font-bold text-[#1D4ED8]">Edit Report</Text>
              </Pressable>
            </View>
          </View>
        ))
      ) : (
        <View className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-8">
          <Text className="text-center text-sm font-semibold text-[#475569]">No reports for this status yet.</Text>
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
