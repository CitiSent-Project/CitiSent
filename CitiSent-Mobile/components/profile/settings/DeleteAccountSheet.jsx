import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { Colors } from "../../../modules/shared";

export default function DeleteAccountSheet({
  visible,
  onCancel,
  onConfirm,
  bottomInset = 0,
}) {
  const translateY = useRef(new Animated.Value(320)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(visible);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      setIsDeleting(false);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!shouldRender) {
      return;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 320,
        duration: 210,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 190,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setShouldRender(false);
      }
    });
  }, [backdropOpacity, shouldRender, translateY, visible]);

  if (!shouldRender) {
    return null;
  }

  const handleConfirm = async () => {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      await onConfirm();
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      visible={shouldRender}
      transparent
      animationType="none"
      onRequestClose={isDeleting ? undefined : onCancel}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Animated.View
          className="absolute inset-0 bg-black"
          style={{
            opacity: backdropOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.35],
            }),
          }}
        >
          <Pressable
            className="h-full w-full"
            onPress={isDeleting ? undefined : onCancel}
            accessibilityRole="button"
          />
        </Animated.View>

        <Animated.View
          className="rounded-t-[26px] bg-white px-5 pt-3"
          style={{
            transform: [{ translateY }],
            paddingBottom: Math.max(bottomInset, 16),
          }}
        >
          <View className="items-center pb-3">
            <View
              className="h-1 w-11 rounded-full"
              style={{ backgroundColor: Colors.border }}
            />
          </View>

          <View className="flex-row items-center pb-3">
            <Pressable
              onPress={isDeleting ? undefined : onCancel}
              accessibilityRole="button"
              accessibilityLabel="Close delete account confirmation"
              className="h-8 w-8 items-center justify-center"
            >
              <Ionicons name="close" size={24} color={Colors.text.primary} />
            </Pressable>

            <Text
              className="flex-1 text-center text-[24px] font-bold"
              style={{ color: Colors.error }}
            >
              Delete Account
            </Text>

            <View className="h-8 w-8" />
          </View>

          <View
            className="h-[1px]"
            style={{ backgroundColor: Colors.border }}
          />

          <View className="py-6">
            <Text
              className="text-center text-[20px] font-semibold"
              style={{ color: Colors.text.primary }}
            >
              Are you sure you want to delete your account?
            </Text>
            <Text
              className="mt-3 text-center text-[14px]"
              style={{ color: Colors.text.secondary }}
            >
              This action is permanent and cannot be undone. All your data,
              reports, and settings will be removed.
            </Text>
          </View>

          <View className="flex-row items-center gap-3 pb-2">
            <Pressable
              className="flex-1 items-center rounded-full py-3"
              style={{ backgroundColor: Colors.ui.progressSoft }}
              onPress={isDeleting ? undefined : onCancel}
              accessibilityRole="button"
              disabled={isDeleting}
            >
              <Text
                className="text-[16px] font-semibold"
                style={{ color: Colors.primary }}
              >
                Cancel
              </Text>
            </Pressable>

            <Pressable
              className="flex-1 items-center rounded-full py-3"
              style={{
                backgroundColor: Colors.error,
                opacity: isDeleting ? 0.7 : 1,
              }}
              onPress={handleConfirm}
              accessibilityRole="button"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-[16px] font-semibold text-white">
                  Yes, Delete
                </Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
