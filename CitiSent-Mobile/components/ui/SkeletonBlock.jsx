import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// ── Shared Animation Driver ──────────────────────────────────────────────────
// A single shared Animated.Value drives all active SkeletonBlock instances in unison.
// This avoids creating dozens of individual JS timers/loops, guarantees zero
// extraneous re-renders, and keeps all skeleton shimmer highlights synchronized.
let sharedShimmerValue = null;
let activeSubscribers = 0;
let shimmerAnimation = null;

function getSharedShimmerValue() {
  if (!sharedShimmerValue) {
    sharedShimmerValue = new Animated.Value(0);
  }
  return sharedShimmerValue;
}

function startSharedShimmer() {
  activeSubscribers++;
  if (activeSubscribers === 1) {
    const value = getSharedShimmerValue();
    value.setValue(0);
    shimmerAnimation = Animated.loop(
      Animated.timing(value, {
        toValue: 1,
        duration: 1400,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: true,
      })
    );
    shimmerAnimation.start();
  }
}

function stopSharedShimmer() {
  activeSubscribers = Math.max(0, activeSubscribers - 1);
  if (activeSubscribers === 0 && shimmerAnimation) {
    shimmerAnimation.stop();
    shimmerAnimation = null;
    if (sharedShimmerValue) {
      sharedShimmerValue.setValue(0);
    }
  }
}

// Neutral soft highlight gradient: transparent -> soft light (0.45 opacity) -> transparent
const SHIMMER_COLORS = [
  "rgba(255, 255, 255, 0)",
  "rgba(255, 255, 255, 0.25)",
  "rgba(255, 255, 255, 0.45)",
  "rgba(255, 255, 255, 0.25)",
  "rgba(255, 255, 255, 0)",
];
const SHIMMER_LOCATIONS = [0, 0.3, 0.5, 0.7, 1];

export default function SkeletonBlock({
  className = "",
  style,
  baseColor = "#E2E8F0",
  children,
}) {
  const [layoutWidth, setLayoutWidth] = useState(0);

  useEffect(() => {
    startSharedShimmer();
    return () => {
      stopSharedShimmer();
    };
  }, []);

  const handleLayout = useCallback(
    (event) => {
      const width = Math.round(event.nativeEvent.layout.width);
      if (width > 0 && Math.abs(width - layoutWidth) > 1) {
        setLayoutWidth(width);
      }
    },
    [layoutWidth]
  );

  const translateX = useMemo(() => {
    if (layoutWidth <= 0) return null;
    return getSharedShimmerValue().interpolate({
      inputRange: [0, 1],
      outputRange: [-layoutWidth, layoutWidth],
    });
  }, [layoutWidth]);

  const hasCustomBg = className.includes("bg-");

  return (
    <View
      onLayout={handleLayout}
      className={`overflow-hidden ${!hasCustomBg ? "bg-[#E2E8F0]" : ""} ${className}`.trim()}
      style={[
        styles.base,
        !hasCustomBg && baseColor ? { backgroundColor: baseColor } : null,
        style,
      ]}
    >
      {layoutWidth > 0 && translateX && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          <LinearGradient
            colors={SHIMMER_COLORS}
            locations={SHIMMER_LOCATIONS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
});
