import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Colors } from "../../constants/colors";

export default function ConfirmationModal({
  visible,
  title,
  message,
  type = "warning",
  onCancel,
  onConfirm,
  cancelText = "Cancel",
  confirmText = "Confirm",
}) {
  const getIconColor = () => {
    switch (type) {
      case "danger":
        return Colors.ui?.dangerText || "#B91C1C"; // Tailwind red-700
      case "warning":
        return Colors.ui?.warningText || "#B45309"; // Tailwind amber-700
      default:
        return Colors.primaryStrong;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "danger":
        return Colors.ui?.dangerSurface || "#FEE2E2"; // Tailwind red-100
      case "warning":
        return Colors.ui?.warningSurface || "#FEF3C7"; // Tailwind amber-100
      default:
        return Colors.ui?.infoSurface || "#EFF6FF"; // Tailwind blue-100
    }
  };

  const getConfirmButtonColor = () => {
    switch (type) {
      case "danger":
        return Colors.ui?.dangerText || "#B91C1C";
      default:
        return Colors.primaryStrong;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <View className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
          <View
            className="mb-4 h-12 w-12 items-center justify-center rounded-full self-center"
            style={{ backgroundColor: getBackgroundColor() }}
          >
            <Text className="text-2xl font-bold" style={{ color: getIconColor() }}>
              {type === "danger" ? "!" : type === "warning" ? "!" : "?"}
            </Text>
          </View>

          <Text className="mb-2 text-center text-xl font-extrabold" style={{ color: Colors.text?.heading || "#111827" }}>
            {title}
          </Text>

          <Text className="mb-6 text-center text-sm" style={{ color: Colors.text?.body || "#374151" }}>
            {message}
          </Text>

          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={onCancel}
              className="flex-1 rounded-xl py-3 border"
              style={{ borderColor: Colors.borderSoft || "#E5E7EB" }}
            >
              <Text className="text-center text-sm font-bold" style={{ color: Colors.text?.primary || "#1F2937" }}>
                {cancelText}
              </Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              className="flex-1 rounded-xl py-3"
              style={{ backgroundColor: getConfirmButtonColor() }}
            >
              <Text className="text-center text-sm font-bold text-white">
                {confirmText}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
