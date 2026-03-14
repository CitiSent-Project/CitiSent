import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Animated, Easing, Modal, Pressable, Text, View } from "react-native";
import { Colors } from "../../constants/colors";

export default function LogoutConfirmSheet({ visible, onCancel, onConfirm, bottomInset = 0 }) {
  const translateY = useRef(new Animated.Value(320)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);

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

  return (
    <Modal visible={shouldRender} transparent animationType="none" onRequestClose={onCancel} statusBarTranslucent>
      <View className="flex-1 justify-end">
        <Animated.View className="absolute inset-0 bg-black" style={{ opacity: backdropOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] }) }}>
          <Pressable className="h-full w-full" onPress={onCancel} accessibilityRole="button" />
        </Animated.View>

        <Animated.View
          className="rounded-t-[26px] bg-white px-5 pt-3"
          style={{
            transform: [{ translateY }],
            paddingBottom: Math.max(bottomInset, 16),
          }}
        >
          <View className="items-center pb-3">
            <View className="h-1 w-11 rounded-full" style={{ backgroundColor: Colors.border }} />
          </View>

          <View className="flex-row items-center pb-3">
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Close logout confirmation"
              className="h-8 w-8 items-center justify-center"
            >
              <Ionicons name="close" size={24} color="#111827" />
            </Pressable>

            <Text className="flex-1 text-center text-[24px] font-bold text-[#EF4444]">Logout</Text>

            <View className="h-8 w-8" />
          </View>

          <View className="h-[1px]" style={{ backgroundColor: Colors.border }} />

          <View className="py-6">
            <Text className="text-center text-[20px] font-semibold text-[#111827]">Are you sure want to Logout?</Text>
          </View>

          <View className="flex-row items-center gap-3 pb-2">
            <Pressable
              className="flex-1 items-center rounded-full py-3"
              style={{ backgroundColor: Colors.ui.progressSoft }}
              onPress={onCancel}
              accessibilityRole="button"
            >
              <Text className="text-[16px] font-semibold text-[#3B82F6]">Cancel</Text>
            </Pressable>

            <Pressable
              className="flex-1 items-center rounded-full py-3"
              style={{ backgroundColor: Colors.primary }}
              onPress={onConfirm}
              accessibilityRole="button"
            >
              <Text className="text-[16px] font-semibold text-white">Yes, Logout</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
