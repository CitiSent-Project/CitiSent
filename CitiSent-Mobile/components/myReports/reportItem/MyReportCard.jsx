import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { formatDateTime } from "../../../utils/formatters";
import ReportAttachmentPreview from "./ReportAttachmentPreview";
import ReportStatusBadge from "./ReportStatusBadge";

function FieldLabel({ text }) {
  return <Text className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">{text}</Text>;
}

export default function MyReportCard({ report, containerClassName = "mb-4" }) {
  return (
    <View className={`${containerClassName} rounded-2xl border border-[#E5E7EB] bg-white px-4 py-4 shadow-sm`}>
      <View className="mb-3 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <FieldLabel text="Issue Type" />
          <Text className="mt-1 text-base font-extrabold text-[#203A5F]">{report.issueType}</Text>
        </View>
        <ReportStatusBadge status={report.status} />
      </View>

      <View className="mb-2 flex-row items-center gap-1.5">
        <Ionicons name="location-outline" size={14} color="#6B7280" />
        <Text className="flex-1 text-sm font-semibold text-[#374151]">{report.location}</Text>
      </View>

      <View className="mt-2 rounded-xl bg-[#F8FAFC] px-3 py-3">
        <FieldLabel text="Description" />
        <Text className="mt-1 text-sm leading-5 text-[#1F2937]">{report.description}</Text>
      </View>

      <ReportAttachmentPreview attachment={report.attachment} />

      <View className="mt-3 flex-row items-center justify-end gap-1.5">
        <Ionicons name="time-outline" size={13} color="#6B7280" />
        <Text className="text-xs font-semibold text-[#6B7280]">{formatDateTime(report.createdAt)}</Text>
      </View>
    </View>
  );
}
