import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";

/**
 * Toast notification component.
 *
 * Provides a sleek, non-intrusive floating confirmation banner across Android, iOS, and Web.
 *
 * @param {boolean} visible - Controls toast visibility.
 * @param {string} message - Main confirmation text (e.g., "Number copied!").
 * @param {string} [submessage] - Optional secondary text (e.g., the phone number).
 * @param {"success"|"info"|"error"} [type="success"] - Style variant.
 * @param {number} [duration=2000] - Duration in ms before auto-dismissing.
 * @param {function} [onDismiss] - Callback invoked when toast hides.
 * @param {number} [bottomOffset=90] - Distance in points from bottom of parent.
 */
export default function Toast({
  visible,
  message = "Number copied!",
  submessage,
  type = "success",
  duration = 2000,
  onDismiss,
  bottomOffset = 90,
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;
  const dismissTimerRef = useRef(null);

  useEffect(() => {
    if (visible) {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }

      // Animate in
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 90,
          useNativeDriver: true,
        }),
      ]).start();

      // Schedule auto-dismiss
      dismissTimerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 10,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onDismiss?.();
        });
      }, duration);
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [visible, message, submessage, duration, onDismiss, opacity, translateY]);

  if (!visible) return null;

  const iconName =
    type === "success"
      ? "checkmark-circle"
      : type === "error"
      ? "alert-circle"
      : "information-circle";

  const iconColor =
    type === "success"
      ? "#22C55E"
      : type === "error"
      ? "#EF4444"
      : Colors?.primary || "#3B82F6";

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { bottom: bottomOffset }]}
    >
      <Animated.View
        style={[
          styles.pill,
          {
            opacity,
            transform: [{ translateY }],
          },
        ]}
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
      >
        <Ionicons name={iconName} size={18} color={iconColor} />
        <View style={styles.textContainer}>
          <Text style={styles.messageText}>{message}</Text>
          {submessage ? (
            <Text style={styles.submessageText} numberOfLines={1}>
              {submessage}
            </Text>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
    zIndex: 9999,
    elevation: 9999,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827", // Rich dark gray-900
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 9999,
    maxWidth: "92%",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.15)",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  textContainer: {
    marginLeft: 8,
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  messageText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  submessageText: {
    color: "#D1D5DB", // Tailwind gray-300
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
  },
});
