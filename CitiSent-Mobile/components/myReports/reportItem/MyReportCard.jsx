import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { formatDateTime } from "../../../utils/formatters";
import ReportAttachmentPreview from "./ReportAttachmentPreview";
import ReportStatusBadge from "./ReportStatusBadge";
import { Colors } from "../../../constants/colors";

function FieldLabel({ text }) {
  return <Text className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: Colors.text.secondary }}>{text}</Text>;
}

export default function MyReportCard({ report, containerClassName = "mb-4" }) {
  return (
    <View className={`${containerClassName} rounded-2xl border bg-white px-4 py-4 shadow-sm`} style={{ borderColor: Colors.border }}>
      <View className="mb-3 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <FieldLabel text="Issue Type" />
          <Text className="mt-1 text-base font-extrabold" style={{ color: Colors.text.issueType }}>{report.issueType}</Text>
        </View>
        <ReportStatusBadge status={report.status} />
      </View>

      <View className="mb-2 flex-row items-center gap-1.5">
        <Ionicons name="location-outline" size={14} color={Colors.text.secondary} />
        <Text className="flex-1 text-sm font-semibold" style={{ color: Colors.text.fieldLabel }}>{report.location}</Text>
      </View>

      <View className="mt-2 rounded-xl px-3 py-3" style={{ backgroundColor: Colors.ui.slateSoft }}>
        <FieldLabel text="Description" />
        <Text className="mt-1 text-sm leading-5" style={{ color: Colors.text.bodyStrong }}>{report.description}</Text>
      </View>

      <ReportAttachmentPreview attachment={report.attachment} />

      <View className="mt-3 flex-row items-center justify-end gap-1.5">
        <Ionicons name="time-outline" size={13} color={Colors.text.secondary} />
        <Text className="text-xs font-semibold" style={{ color: Colors.text.secondary }}>{formatDateTime(report.createdAt)}</Text>
      </View>
    </View>
  );
}
