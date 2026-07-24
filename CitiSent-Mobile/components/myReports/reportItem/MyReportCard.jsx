import { Ionicons } from "@expo/vector-icons";
import { Text, View, Pressable, Alert } from "react-native";
import { formatDateTime } from "../../../modules/shared";
import ReportAttachmentPreview from "./ReportAttachmentPreview";
import ReportStatusBadge from "./ReportStatusBadge";
import { Colors } from "../../../modules/shared";

function FieldLabel({ text }) {
  return <Text className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: Colors.text.secondary }}>{text}</Text>;
}

export default function MyReportCard({ report, containerClassName = "mb-4", onDelete, onOpenDiscussion }) {
  const handleDelete = () => {
    Alert.alert(
      "Delete Report",
      "Are you sure you want to delete this report? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete?.(report.id),
        },
      ]
    );
  };

  return (
    <View className={`${containerClassName} rounded-2xl border px-4 py-4 shadow-sm`} style={{ borderColor: Colors.border, backgroundColor: Colors.background }}>
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

      <View className="mt-3 flex-row items-center justify-between gap-1.5 border-t border-slate-100 pt-3">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="time-outline" size={13} color={Colors.text.secondary} />
          <Text className="text-xs font-semibold" style={{ color: Colors.text.secondary }}>{formatDateTime(report.createdAt)}</Text>
        </View>

        <View className="flex-row items-center gap-2">
          {onOpenDiscussion && (
            <Pressable
              onPress={() => onOpenDiscussion(report)}
              className="flex-row items-center rounded-lg px-2.5 py-1.5 bg-blue-50 border border-blue-200 active:bg-blue-100"
            >
              <Ionicons name="chatbubbles-outline" size={14} color={Colors.primaryStrong} />
              <Text className="ml-1 text-xs font-bold" style={{ color: Colors.primaryStrong }}>
                Chat with Admin
              </Text>
            </Pressable>
          )}

          {onDelete && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete report"
              onPress={handleDelete}
              className="flex-row items-center rounded-lg px-2 py-1.5"
              style={{ backgroundColor: Colors.ui.errorSurface }}
            >
              <Ionicons name="trash-outline" size={14} color={Colors.error} />
              <Text className="ml-1 text-xs font-semibold" style={{ color: Colors.error }}>
                Delete
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
