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
import { discussionService } from "../../services/discussionService";
import { getAuthUser } from "../../services/authSession";

function formatMessageDateTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${date} • ${time}`;
}

export default function ReportDiscussionModal({ visible, report, onClose, onMarkRead }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef(null);
  const currentUser = getAuthUser();
  const currentUserId = currentUser?.id ?? null;

  /**
   * Guard ref to prevent setState calls after the component unmounts.
   * This protects the onAdminReply callback in handleSendMessage, which fires
   * inside a 3-second setTimeout that outlives the modal if the user closes it.
   * Fix for Issue #7 (uncancelled setTimeout causing state update on unmounted component).
   */
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (visible && report?.id) {
      loadMessages();
      // Mark as read whenever the chat is opened, ensuring the badge always
      // clears immediately and server read-state is reconciled. The parent's
      // onMarkRead callback lets the badge update in the list without waiting
      // for a full data refetch.
      discussionService.markAsRead(report.id).catch(() => { });
      onMarkRead?.(report.id);
    } else {
      setMessages([]);
      setInputText("");
    }
  }, [visible, report?.id]);

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

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    setSending(true);
    try {
      const updatedMessages = await discussionService.sendMessage(
        report.id,
        inputText,
        null,
        (adminUpdatedMessages) => {
          // Guard: only update state if the modal is still mounted.
          // The callback fires from a 3-second setTimeout in sendMessage,
          // which can outlive the modal if the user closes it first.
          // Fix for Issue #7.
          if (!isMountedRef.current) return;
          setMessages(adminUpdatedMessages);
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        },
        currentUserId
      );
      setMessages(updatedMessages);
      setInputText("");
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.warn("Failed to send message:", err);
    } finally {
      setSending(false);
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
              {messages.map((item) => {
                const isAdmin = item.senderRole === "admin";

                return (
                  <View
                    key={item.id}
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
              onChangeText={setInputText}
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
