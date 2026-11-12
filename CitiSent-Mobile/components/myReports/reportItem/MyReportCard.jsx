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
  onOpenFeedback,
  hasUnreadAdminMessage = false,
  unreadCount = 0,
}) {
  const showBadge = Boolean(hasUnreadAdminMessage || unreadCount > 0);
  const normalizedStatus = String(report?.status || "").trim().toLowerCase();
  const isResolved =
    normalizedStatus === "completed" ||
    normalizedStatus === "resolved" ||
    String(report?.rawStatus || "").trim().toLowerCase() === "resolved";
  const feedback = report?.feedback || null;

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

      {/* Resident Feedback on Government Solution (only for Resolved / Completed reports) */}
      {isResolved && (
        <View
          className="mt-3 rounded-xl border px-3.5 py-3"
          style={{
            backgroundColor: feedback ? (Colors.ui.successSoft || "#E9F8EF") : (Colors.ui.infoSurface || "#EFF6FF"),
            borderColor: feedback ? "#BBF7D0" : (Colors.ui.infoSurfaceBorder || "#DBEAFE"),
          }}
        >
          {feedback ? (
            <View>
              <View className="flex-row items-center justify-between gap-2">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="checkmark-circle" size={15} color={Colors.text.statusComplete || "#2C8A5A"} />
                  <Text className="text-xs font-extrabold" style={{ color: Colors.text.statusComplete || "#2C8A5A" }}>
                    Feedback Submitted
                  </Text>
                </View>

                <View className="flex-row items-center gap-1 rounded-full px-2 py-0.5" style={{ backgroundColor: "#FEF3C7" }}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text className="text-xs font-extrabold" style={{ color: "#B45309" }}>
                    {feedback.rating}/5
                  </Text>
                </View>
              </View>

              {typeof feedback.isSatisfied === "boolean" && (
                <View className="mt-1.5 flex-row items-center gap-1">
                  <Ionicons
                    name={feedback.isSatisfied ? "thumbs-up" : "thumbs-down"}
                    size={12}
                    color={feedback.isSatisfied ? "#15803D" : "#B91C1C"}
                  />
                  <Text
                    className="text-[11px] font-bold"
                    style={{ color: feedback.isSatisfied ? "#15803D" : "#B91C1C" }}
                  >
                    {feedback.isSatisfied ? "Satisfied with solution" : "Not satisfied with solution"}
                  </Text>
                </View>
              )}

              {Boolean(feedback.comment) && (
                <Text
                  className="mt-1.5 text-xs leading-4"
                  style={{ color: Colors.text.bodyStrong }}
                  numberOfLines={2}
                >
                  &ldquo;{feedback.comment}&rdquo;
                </Text>
              )}

              {onOpenFeedback && (
                <Pressable
                  onPress={() => onOpenFeedback(report)}
                  className="mt-2 self-start flex-row items-center gap-1 rounded-lg border px-2.5 py-1 active:opacity-80"
                  style={{ borderColor: "#86EFAC", backgroundColor: "#FFFFFF" }}
                >
                  <Ionicons name="eye-outline" size={12} color={Colors.text.statusComplete || "#2C8A5A"} />
                  <Text className="text-[11px] font-bold" style={{ color: Colors.text.statusComplete || "#2C8A5A" }}>
                    View Submitted Feedback
                  </Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <Text className="text-xs font-extrabold" style={{ color: Colors.text.infoHeading || "#1E3A8A" }}>
                  How was the government&apos;s solution?
                </Text>
                <Text className="mt-0.5 text-[11px]" style={{ color: Colors.text.secondary }}>
                  Rate and evaluate how this concern was resolved.
                </Text>
              </View>

              {onOpenFeedback && (
                <Pressable
                  onPress={() => onOpenFeedback(report)}
                  className="flex-row items-center gap-1 rounded-xl px-3 py-2 active:opacity-80"
                  style={{ backgroundColor: Colors.primaryStrong }}
                >
                  <Ionicons name="star" size={13} color="#FDE047" />
                  <Text className="text-xs font-bold text-white">
                    Give Feedback
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      )}

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
