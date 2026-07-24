import { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Colors } from "../../modules/shared";
import { discussionService } from "../../services/discussionService";
import { getAuthUser } from "../../services/authSession";

function formatMessageTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ReportDiscussionModal({ visible, report, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [attachedImage, setAttachedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef(null);
  const currentUser = getAuthUser();
  const currentUserId = currentUser?.id ?? null;

  useEffect(() => {
    if (visible && report?.id) {
      loadMessages();
    } else {
      setMessages([]);
      setInputText("");
      setAttachedImage(null);
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

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAttachedImage(result.assets[0].uri);
      }
    } catch (err) {
      console.warn("Image picker error:", err);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && !attachedImage) return;

    setSending(true);
    try {
      const updatedMessages = await discussionService.sendMessage(
        report.id,
        inputText,
        attachedImage,
        (adminUpdatedMessages) => {
          setMessages(adminUpdatedMessages);
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        },
        currentUserId
      );
      setMessages(updatedMessages);
      setInputText("");
      setAttachedImage(null);
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
                <Ionicons name="chatbubbles" size={18} color={Colors.icon.primary} />
                <Text className="text-base font-extrabold" style={{ color: Colors.text.inverse }}>
                  Admin Discussion
                </Text>
              </View>
              <Text className="text-xs font-medium" style={{ color: Colors.ui.heroSoft }}>
                Report Ref: #{String(report.id).slice(-8).toUpperCase()} • {report.issueType}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              className="h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: Colors.ui.headerAvatarDark }}
            >
              <Ionicons name="close" size={20} color={Colors.icon.light} />
            </Pressable>
          </View>

          {/* Report Details Brief Summary */}
          <View className="border-b px-5 py-3" style={{ backgroundColor: Colors.surface, borderColor: Colors.borderLight }}>
            <Text className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: Colors.text.secondary }}>
              Report Summary
            </Text>
            <Text className="text-xs font-bold" style={{ color: Colors.text.headingCard }} numberOfLines={1}>
              📍 {report.location}
            </Text>
            <Text className="mt-0.5 text-xs" style={{ color: Colors.text.body }} numberOfLines={2}>
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
                        <Ionicons name="person-circle" size={45} color={Colors.icon.primary} />
                      </View>
                    )}

                    <View 
                      className="max-w-[85%] p-3.5 border rounded-xl"
                      style={{ 
                        backgroundColor: isAdmin ? Colors.surface : Colors.primary,
                        borderColor: isAdmin ? Colors.borderMuted : Colors.primaryStrong,
                      }}
                    >
                      <Text 
                        className="text-xs font-bold mb-1"
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

                      {item.attachmentUri && (
                        <Image
                          source={{ uri: item.attachmentUri }}
                          className="mt-2 h-40 w-full"
                          resizeMode="cover"
                        />
                      )}

                      <Text 
                        className="mt-1.5 text-xs text-right"
                        style={{ color: isAdmin ? Colors.text.secondary : Colors.ui.heroSoft }}
                      >
                        {formatMessageTime(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Attached Image Preview Bar */}
          {attachedImage && (
            <View 
              className="flex-row items-center border-t px-4 py-2"
              style={{ backgroundColor: Colors.ui.neutralSoft, borderColor: Colors.borderMuted }}
            >
              <Image source={{ uri: attachedImage }} className="h-10 w-10 mr-2" />
              <Text className="flex-1 text-xs font-semibold" style={{ color: Colors.text.bodyStrong }}>Image attached</Text>
              <Pressable onPress={() => setAttachedImage(null)} className="p-1">
                <Ionicons name="close-circle" size={18} color={Colors.error} />
              </Pressable>
            </View>
          )}

          {/* Input Bar */}
          <View 
            className="border-t px-4 py-3 flex-row items-center gap-2"
            style={{ backgroundColor: Colors.surface, borderColor: Colors.borderMuted }}
          >
            <Pressable
              onPress={handlePickImage}
              className="h-10 w-10 items-center justify-center border"
              style={{ backgroundColor: Colors.background, borderColor: Colors.borderMuted }}
            >
              <Ionicons name="camera-outline" size={18} color={Colors.text.bodySoft} />
            </Pressable>

            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message to admin..."
              placeholderTextColor={Colors.icon.muted}
              className="flex-1 min-h-[40px] max-h-[100px] border px-3 py-2 text-sm"
              style={{ backgroundColor: Colors.background, borderColor: Colors.borderMuted, color: Colors.text.primary }}
              multiline
            />

            <Pressable
              onPress={handleSendMessage}
              disabled={sending || (!inputText.trim() && !attachedImage)}
              className="h-10 w-10 items-center justify-center"
              style={{ 
                backgroundColor: (inputText.trim() || attachedImage) ? Colors.primaryStrong : Colors.ui.neutralSoft
              }}
            >
              {sending ? (
                <ActivityIndicator size="small" color={Colors.surface} />
              ) : (
                <Ionicons
                  name="send"
                  size={15}
                  color={(inputText.trim() || attachedImage) ? Colors.surface : Colors.icon.subtle}
                />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
