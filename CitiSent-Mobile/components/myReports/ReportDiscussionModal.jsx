import { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../modules/shared";
import { discussionService, mapRawRow } from "../../services/discussionService";
import { getAuthUser } from "../../services/authSession";
import {
  getSocket,
  joinReportRoom,
  leaveReportRoom,
  sendSocketMessage,
  markSocketConversationRead,
  sendSocketTyping,
  sendSocketStopTyping,
} from "../../services/socketService";

import { getSupabaseClient } from "../../services/supabase";

function formatMessageDateTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${date} • ${time}`;
}

function formatIncomingMessage(raw, userId) {
  if (!raw) return null;
  if (typeof mapRawRow === "function") {
    try {
      return mapRawRow(raw, userId);
    } catch {}
  }
  if (typeof discussionService?.mapRawRow === "function") {
    try {
      return discussionService.mapRawRow(raw, userId);
    } catch {}
  }

  const senderId = String(raw.senderId ?? raw.sender_id ?? "");
  const isCurrentUser = userId && senderId && String(senderId) === String(userId);
  return {
    id: raw.id || `msg-${Date.now()}`,
    senderId,
    senderName: isCurrentUser ? "You" : (raw.sender_name || raw.senderName || "City Admin"),
    senderRole: raw.senderRole || (isCurrentUser ? "citizen" : "admin"),
    message: raw.message || raw.content || "",
    attachmentUri: null,
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    isRead: raw.isRead ?? false,
  };
}

export default function ReportDiscussionModal({ visible, report, onClose, onMarkRead }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isAdminTyping, setIsAdminTyping] = useState(false);

  const scrollViewRef = useRef(null);
  const typingTimerRef = useRef(null);

  const currentUser = getAuthUser();
  const currentUserId = currentUser?.id ?? null;

  /**
   * Guard ref to prevent setState calls after the component unmounts.
   * This protects async send callbacks if the user closes the modal mid-request.
   */
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // ─── Initial Load & Mark Read ──────────────────────────────────────────────
  useEffect(() => {
    if (visible && report?.id) {
      loadMessages();
      discussionService.markAsRead(report.id).catch(() => {});
      markSocketConversationRead({ reportId: report.id });
      onMarkRead?.(report.id);
    } else {
      setMessages([]);
      setInputText("");
      setIsAdminTyping(false);
    }
  }, [visible, report?.id]);

  // ─── Supabase Realtime & Socket.IO Subscriptions ───────────────────────────
  useEffect(() => {
    if (!visible || !report?.id) return;

    // Supabase Realtime channel
    let supabaseChannel = null;
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        supabaseChannel = supabase
          .channel(`report_modal_messages:${report.id}`)
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "report_messages", filter: `report_id=eq.${report.id}` },
            (payload) => {
              const rawMsg = payload.new;
              if (!rawMsg) return;
              const newMsg = formatIncomingMessage(rawMsg, currentUserId);
              if (!newMsg) return;

              setMessages((prev) => {
                if (prev.some((m) => String(m.id) === String(newMsg.id))) {
                  return prev;
                }
                const pendingIndex = prev.findIndex(
                  (m) => m.pending && m.message === newMsg.message && String(m.senderId) === String(newMsg.senderId)
                );
                if (pendingIndex !== -1) {
                  const updated = [...prev];
                  updated[pendingIndex] = newMsg;
                  return updated;
                }
                return [...prev, newMsg];
              });

              if (newMsg.senderRole !== "citizen") {
                discussionService.markAsRead(report.id).catch(() => {});
                markSocketConversationRead({ reportId: report.id });
                onMarkRead?.(report.id);
              }

              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 80);
            }
          )
          .subscribe();
      }
    } catch (err) {
      console.warn("Failed to subscribe to Supabase Realtime in modal:", err);
    }

    // Socket.IO room & listeners
    const socket = getSocket();
    joinReportRoom(report.id);

    const handleReceiveMessage = (data) => {
      if (String(data?.reportId) !== String(report.id) || !data?.message) return;

      const newMsg = formatIncomingMessage(data.message, currentUserId);
      if (!newMsg) return;

      setMessages((prev) => {
        // 1. Skip if message ID is already present
        if (prev.some((m) => String(m.id) === String(newMsg.id))) {
          return prev;
        }

        // 2. If an optimistic pending message matches sender & message text, replace it
        const pendingIndex = prev.findIndex(
          (m) => m.pending && m.message === newMsg.message && String(m.senderId) === String(newMsg.senderId)
        );

        if (pendingIndex !== -1) {
          const updated = [...prev];
          updated[pendingIndex] = newMsg;
          return updated;
        }

        return [...prev, newMsg];
      });

      if (newMsg.senderRole !== "citizen") {
        discussionService.markAsRead(report.id).catch(() => {});
        markSocketConversationRead({ reportId: report.id });
        onMarkRead?.(report.id);
      }

      // Auto-scroll
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 80);
    };

    const handleMessagesRead = (data) => {
      if (String(data?.reportId) !== String(report.id)) return;

      setMessages((prev) =>
        prev.map((msg) => ({
          ...msg,
          isRead: true,
        }))
      );
    };

    const handleTyping = (data) => {
      if (String(data?.reportId) === String(report.id) && String(data?.userId) !== String(currentUserId)) {
        setIsAdminTyping(true);
      }
    };

    const handleStopTyping = (data) => {
      if (String(data?.reportId) === String(report.id) && String(data?.userId) !== String(currentUserId)) {
        setIsAdminTyping(false);
      }
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("messages_read", handleMessagesRead);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);

    return () => {
      if (supabaseChannel) {
        try {
          const supabase = getSupabaseClient();
          supabase.removeChannel(supabaseChannel);
        } catch {}
      }
      socket.off("receive_message", handleReceiveMessage);
      socket.off("messages_read", handleMessagesRead);
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      leaveReportRoom(report.id);
    };
  }, [visible, report?.id, currentUserId]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await discussionService.getDiscussion(report.id, currentUserId);
      setMessages(data);
    } catch (err) {
      console.warn("Failed to load messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (text) => {
    setInputText(text);

    if (report?.id) {
      sendSocketTyping(report.id);

      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }

      typingTimerRef.current = setTimeout(() => {
        sendSocketStopTyping(report.id);
      }, 2000);
    }
  };

  const handleSendMessage = async () => {
    const trimmedText = inputText.trim();
    if (!trimmedText || !report?.id) return;

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    sendSocketStopTyping(report.id);

    setSending(true);
    const tempId = `msg-local-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      senderId: String(currentUserId ?? ""),
      senderName: "You",
      senderRole: "citizen",
      message: trimmedText,
      createdAt: new Date().toISOString(),
      isRead: false,
      pending: true,
    };

    // Optimistically update UI
    setMessages((prev) => [...prev, optimisticMessage]);
    setInputText("");
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 80);

    try {
      // Send via Socket.IO
      const confirmedMessage = await sendSocketMessage({
        reportId: report.id,
        message: trimmedText,
      });

      const mappedConfirmed = formatIncomingMessage(confirmedMessage, currentUserId);

      // Replace optimistic message safely or deduplicate if receive_message arrived first
      setMessages((prev) => {
        if (!mappedConfirmed) {
          return prev.filter((m) => m.id !== tempId);
        }
        if (prev.some((m) => String(m.id) === String(mappedConfirmed.id))) {
          return prev.filter((m) => m.id !== tempId);
        }
        return prev.map((msg) => (msg.id === tempId ? mappedConfirmed : msg));
      });
    } catch (socketErr) {
      console.warn("Socket send failed, falling back to HTTP API:", socketErr?.message);
      try {
        const updatedMessages = await discussionService.sendMessage(
          report.id,
          trimmedText,
          null,
          null,
          currentUserId
        );
        if (isMountedRef.current) {
          setMessages(updatedMessages);
        }
      } catch (err) {
        console.warn("Failed to send message:", err);
      }
    } finally {
      if (isMountedRef.current) {
        setSending(false);
      }
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 80);
    }
  };

  if (!report) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        style={{ backgroundColor: Colors.background }}
      >
        <View className="flex-1 w-full" style={{ backgroundColor: Colors.background }}>
          {/* Header */}
          <View
            className="flex-row items-center justify-between border-b px-5 py-4"
            style={{ backgroundColor: Colors.ui.headerDark, borderColor: Colors.ui.headerAvatarDark }}
          >
            <View className="flex-1 pr-2">
              <View className="flex-row items-center gap-2 mb-0.5">
                <Ionicons name="chatbubbles" size={20} color={Colors.icon.primary} />
                <Text className="text-lg font-bold" style={{ color: Colors.text.inverse }}>
                  Admin Discussion
                </Text>
              </View>
              <Text className="text-xs font-semibold" style={{ color: Colors.ui.heroSoft }}>
                Report Ref: #{String(report.id).slice(-8).toUpperCase()} • {report.issueType}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: Colors.ui.headerAvatarDark }}
            >
              <Ionicons name="close" size={22} color={Colors.icon.light} />
            </Pressable>
          </View>

          {/* Report Details Brief Summary */}
          <View className="border-b px-5 py-3.5" style={{ backgroundColor: Colors.surface, borderColor: Colors.borderSoft }}>
            <Text className="text-[10px] font-extrabold uppercase tracking-wider mb-1" style={{ color: Colors.text.secondary }}>
              Report Summary
            </Text>
            <Text className="text-xs font-bold" style={{ color: Colors.text.headingCard }} numberOfLines={1}>
              📍 {report.location}
            </Text>
            <Text className="mt-1 text-xs leading-4" style={{ color: Colors.text.body }} numberOfLines={2}>
              "{report.description}"
            </Text>
          </View>

          {/* Chat Timeline */}
          {loading ? (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: Colors.screen.profileSubpage }}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text className="mt-2 text-xs font-semibold" style={{ color: Colors.text.secondary }}>Loading conversation...</Text>
            </View>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              className="flex-1 px-4 py-4"
              style={{ backgroundColor: Colors.screen.profileSubpage }}
              contentContainerStyle={{ paddingBottom: 16 }}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map((item, index) => {
                const isAdmin = item.senderRole === "admin";
                const itemKey = item.id ? String(item.id) : `msg-${index}`;

                return (
                  <View
                    key={itemKey}
                    className={`mb-4 flex-row ${isAdmin ? "justify-start" : "justify-end"}`}
                  >
                    {isAdmin && (
                      <View className="mr-2 pt-1 items-center justify-start">
                        <Ionicons name="person-circle" size={40} color={Colors.icon.primary} />
                      </View>
                    )}

                    <View
                      className={`max-w-[80%] p-3.5 border ${isAdmin
                        ? "rounded-2xl rounded-tl-none"
                        : "rounded-2xl rounded-tr-none"
                        }`}
                      style={{
                        backgroundColor: isAdmin ? Colors.surface : Colors.primary,
                        borderColor: isAdmin ? Colors.borderSoft : Colors.primaryStrong,
                      }}
                    >
                      <Text
                        className="text-[11px] font-bold mb-1"
                        style={{ color: isAdmin ? Colors.text.headingBrand : Colors.ui.heroSoft }}
                      >
                        {item.senderName}
                      </Text>

                      {item.message ? (
                        <Text
                          className="text-sm leading-5"
                          style={{ color: isAdmin ? Colors.text.bodyStrong : Colors.text.inverse }}
                        >
                          {item.message}
                        </Text>
                      ) : null}

                      <Text
                        className="mt-1.5 text-[10px] text-right"
                        style={{ color: isAdmin ? Colors.text.secondary : Colors.ui.heroSoft }}
                      >
                        {formatMessageDateTime(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Typing Indicator Bar */}
          {isAdminTyping && (
            <View className="px-5 py-1.5 bg-slate-100 flex-row items-center gap-1.5">
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text className="text-xs italic text-slate-500 font-medium">
                City Admin is typing...
              </Text>
            </View>
          )}

          {/* Input Bar */}
          <View
            className="border-t px-4 py-3 flex-row items-center gap-2"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.borderSoft,
              paddingBottom: Platform.OS === 'ios' ? 24 : 12
            }}
          >
            <TextInput
              value={inputText}
              onChangeText={handleInputChange}
              placeholder="Type your message to admin..."
              placeholderTextColor={Colors.icon.muted}
              className="flex-1 min-h-[44px] max-h-[100px] border px-4 py-2 text-sm rounded-full"
              style={{
                backgroundColor: Colors.ui.slateSoft,
                borderColor: Colors.borderSoft,
                color: Colors.text.primary
              }}
              multiline
            />

            <Pressable
              onPress={handleSendMessage}
              disabled={sending || !inputText.trim()}
              className="h-11 w-11 items-center justify-center rounded-full"
              style={{
                backgroundColor: inputText.trim() ? Colors.primaryStrong : Colors.ui.neutralSoft
              }}
            >
              {sending ? (
                <ActivityIndicator size="small" color={Colors.surface} />
              ) : (
                <Ionicons
                  name="send"
                  size={16}
                  color={inputText.trim() ? Colors.surface : Colors.icon.subtle}
                />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
