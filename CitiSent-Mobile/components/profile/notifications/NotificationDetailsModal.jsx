import React from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../../modules/shared";

export default function NotificationDetailsModal({ visible, notification, onClose }) {
  if (!notification) return null;

  const iconByType = {
    report: "document-text-outline",
    status: "checkmark-done-circle-outline",
    account: "person-circle-outline",
    alert: "warning-outline",
    message: "chatbubble-ellipses-outline",
  };

  const iconName = iconByType[notification.type] || "notifications-outline";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <View className="max-h-[80%] w-full max-w-md rounded-2xl bg-white shadow-lg overflow-hidden">
          
          <View className="flex-row items-center justify-between border-b border-slate-100 px-6 py-4">
            <View className="flex-row items-center gap-2">
              <View
                className="h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: Colors.ui.infoSurfaceBorder }}
              >
                <Ionicons name={iconName} size={16} color={Colors.primaryStrong} />
              </View>
              <Text className="text-lg font-bold" style={{ color: Colors.text.heading }}>
                Notification
              </Text>
            </View>
            <Pressable onPress={onClose} className="rounded-full p-1" style={{ backgroundColor: Colors.ui.neutralSoft }}>
              <Ionicons name="close" size={20} color={Colors.text.secondary} />
            </Pressable>
          </View>
          
          <ScrollView className="px-6 py-4">
            <Text className="mb-2 text-xl font-extrabold" style={{ color: Colors.text.heading }}>
              {notification.title}
            </Text>
            
            <Text className="mb-4 text-xs font-semibold" style={{ color: Colors.text.secondary }}>
              {notification.timeLabel}
            </Text>

            {notification.type === "message" ? (
              <View className="mb-4">
                {/* Report context card */}
                {(notification.meta?.issueType || notification.meta?.reportId) && (
                  <View
                    className="rounded-xl border px-4 py-3 mb-3"
                    style={{ backgroundColor: Colors.ui.infoSurface, borderColor: Colors.ui.infoSurfaceBorder }}
                  >
                    <Text className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: Colors.text.infoHeading }}>
                      Report
                    </Text>
                    {notification.meta?.issueType && (
                      <Text className="text-sm font-extrabold mb-0.5" style={{ color: Colors.text.issueType }}>
                        {notification.meta.issueType}
                      </Text>
                    )}
                    {notification.meta?.reportDescription && (
                      <Text className="text-xs leading-5 mb-1" style={{ color: Colors.text.bodySoft }} numberOfLines={2}>
                        {notification.meta.reportDescription}
                      </Text>
                    )}
                    {notification.meta?.reportId && (
                      <Text className="text-xs font-semibold mt-1" style={{ color: Colors.text.secondary }}>
                        Ref: #{String(notification.meta.reportId).slice(-8).toUpperCase()}
                      </Text>
                    )}
                  </View>
                )}

                {/* Admin reply bubble */}
                <View className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                  <View className="flex-row items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                    <View
                      className="h-8 w-8 items-center justify-center rounded-full"
                      style={{ backgroundColor: Colors.ui.infoSurfaceBorder }}
                    >
                      <Ionicons name="shield-checkmark" size={16} color={Colors.primaryStrong} />
                    </View>
                    <View>
                      <Text className="text-sm font-bold" style={{ color: Colors.text.heading }}>Admin replied</Text>
                      <Text className="text-xs" style={{ color: Colors.text.secondary }}>{notification.timeLabel}</Text>
                    </View>
                  </View>

                  {/* Admin message in a chat bubble style */}
                  <View className="rounded-xl px-4 py-3" style={{ backgroundColor: Colors.background }}>
                    <Text className="text-sm leading-6" style={{ color: Colors.text.bodyStrong }}>
                      {notification.message}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-1.5 mt-3">
                    <Ionicons name="chatbubbles-outline" size={13} color={Colors.primaryStrong} />
                    <Text className="text-xs flex-1" style={{ color: Colors.text.secondary }}>
                      Go to <Text className="font-bold" style={{ color: Colors.primaryStrong }}>Manage Reports</Text> → <Text className="font-bold" style={{ color: Colors.primaryStrong }}>Chat with Admin</Text> to reply.
                    </Text>
                  </View>
                </View>
              </View>
            ) : notification.meta && notification.meta.status ? (
              <View className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm mb-4">
                <View className="flex-row items-center justify-between mb-3 border-b border-slate-100 pb-3">
                  <Text className="text-sm font-bold" style={{ color: Colors.text.heading }}>
                    Report Status
                  </Text>
                  <View 
                    className="rounded-full px-3 py-1" 
                    style={{ 
                      backgroundColor: notification.meta.status.toLowerCase() === "resolved" 
                        ? Colors.ui.successSoft 
                        : notification.meta.status.toLowerCase() === "rejected"
                        ? Colors.ui.dangerSoft
                        : Colors.ui.infoSurface 
                    }}
                  >
                    <Text 
                      className="text-xs font-bold"
                      style={{ 
                        color: notification.meta.status.toLowerCase() === "resolved" 
                          ? Colors.text.statusComplete 
                        : notification.meta.status.toLowerCase() === "rejected"
                          ? Colors.text.statusRejected
                          : Colors.text.statusProgress 
                      }}
                    >
                      {notification.meta.status}
                    </Text>
                  </View>
                </View>

                {notification.meta.adminMessage ? (
                  <View className="mb-3">
                    <Text className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: Colors.text.secondary }}>
                      Admin Message
                    </Text>
                    <Text className="text-sm leading-6" style={{ color: Colors.text.body }}>
                      {notification.meta.adminMessage}
                    </Text>
                  </View>
                ) : null}

                {notification.meta.processedOn ? (
                  <View className="mb-3">
                    <Text className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: Colors.text.secondary }}>
                      Processed On
                    </Text>
                    <Text className="text-sm" style={{ color: Colors.text.body }}>
                      {notification.meta.processedOn}
                    </Text>
                  </View>
                ) : null}

                {notification.meta.issueType || notification.meta.reportId ? (
                  <View className="border-t border-slate-100 pt-3">
                    <Text className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: Colors.text.secondary }}>
                      Report Details
                    </Text>
                    {notification.meta.reportId ? (
                      <Text className="text-xs mb-1" style={{ color: Colors.text.body }}>
                        <Text className="font-semibold">Reference ID:</Text> {notification.meta.reportId}
                      </Text>
                    ) : null}
                    {notification.meta.issueType ? (
                      <Text className="text-xs mb-1" style={{ color: Colors.text.body }}>
                        <Text className="font-semibold">Category/Subject:</Text> {notification.meta.issueType}
                      </Text>
                    ) : null}
                    {notification.meta.reportDescription ? (
                      <Text className="text-xs leading-5" style={{ color: Colors.text.body }}>
                        <Text className="font-semibold">Description:</Text> {notification.meta.reportDescription}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
            ) : (
              <View className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <Text className="text-sm leading-6" style={{ color: Colors.text.body }}>
                  {notification.message}
                </Text>
              </View>
            )}
          </ScrollView>

          <View className="border-t border-slate-100 px-6 py-4">
            <Pressable
              onPress={onClose}
              className="w-full rounded-xl py-3"
              style={{ backgroundColor: Colors.primaryStrong }}
            >
              <Text className="text-center text-sm font-bold text-white">
                Close
              </Text>
            </Pressable>
          </View>

        </View>
      </View>
    </Modal>
  );
}
