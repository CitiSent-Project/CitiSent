import { Ionicons } from "@expo/vector-icons";
import { Text, View, Pressable } from "react-native";
import { formatDateTime } from "../../../modules/shared";
import ReportAttachmentPreview from "./ReportAttachmentPreview";
import ReportStatusBadge from "./ReportStatusBadge";
import { Colors } from "../../../modules/shared";

function FieldLabel({ text }) {
  return <Text className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: Colors.text.secondary }}>{text}</Text>;
}

export default function MyReportCard({
  report,
  containerClassName = "mb-4",
  onOpenDiscussion,
  hasUnreadAdminMessage = false,
  unreadCount = 0,
}) {
  const showBadge = Boolean(hasUnreadAdminMessage || unreadCount > 0);

  return (
    <View className={`${containerClassName} rounded-2xl border px-4 py-4 shadow-sm`} style={{ borderColor: Colors.border, backgroundColor: Colors.background }}>
      <View className="mb-3 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <FieldLabel text="Selected Department" />
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
            <View className="relative">
              <Pressable
                onPress={() => onOpenDiscussion(report)}
                className="flex-row items-center rounded-lg px-2.5 py-1.5 active:opacity-80"
                style={{ backgroundColor: Colors.primaryStrong }}
              >
                <Ionicons name="chatbubbles-outline" size={14} color="#fff" />
                <Text className="ml-1 text-xs font-bold text-white">
                  Chat with Admin
                </Text>
              </Pressable>
              {showBadge && (
                <View
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
                  style={{ backgroundColor: Colors.error }}
                />
              )}
            </View>
          )}


        </View>
      </View>
    </View>
  );
}
