import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { formatDateTime } from "../../../utils/formatters";
import ReportAttachmentPreview from "./ReportAttachmentPreview";
import ReportStatusBadge from "./ReportStatusBadge";

const priorityChipStyles = {
  emergency: { container: "bg-[#FFE3E3]", text: "text-[#991B1B]", label: "Emergency" },
  urgent: { container: "bg-[#FFE7CC]", text: "text-[#9A3412]", label: "Urgent" },
  moderate: { container: "bg-[#FFF7BF]", text: "text-[#713F12]", label: "Moderate" },
  low: { container: "bg-[#D8FFD1]", text: "text-[#166534]", label: "Low priority" },
};

function normalizePriority(priorityValue) {
  const value = String(priorityValue || "").trim().toLowerCase();

  if (value === "emergency") return "emergency";
  if (value === "urgent") return "urgent";
  if (value === "moderate") return "moderate";
  if (value === "low" || value === "low priority") return "low";

  return null;
}

function FieldLabel({ text }) {
  return <Text className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">{text}</Text>;
}

export default function MyReportCard({ report }) {
  const normalizedPriority = normalizePriority(report?.priority ?? report?.priorityLevel ?? report?.tags?.[0]);
  const priorityStyle = normalizedPriority ? priorityChipStyles[normalizedPriority] : null;

  return (
    <View className="mb-4 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-4 shadow-sm">
      <View className="mb-3 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <FieldLabel text="Issue Type" />
          <Text className="mt-1 text-base font-extrabold text-[#203A5F]">{report.issueType}</Text>
          {priorityStyle ? (
            <View className={`mt-2 self-start rounded-full px-3 py-1 ${priorityStyle.container}`}>
              <Text className={`text-[11px] font-extrabold ${priorityStyle.text}`}>{priorityStyle.label}</Text>
            </View>
          ) : null}
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
