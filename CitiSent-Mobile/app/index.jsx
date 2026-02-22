import { useEffect, useRef } from "react";
import { View, Text, Image, Animated } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    // Fade + scale in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to tabs after 3 seconds
    const timer = setTimeout(() => {
      router.replace("/(tabs)");
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View className="flex-1 bg-[#1B2D4F] items-center justify-center">
      <StatusBar style="light" />
      <Animated.View
        className="items-center gap-4"
        style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
      >
        <Image
          source={require("../assets/logo/logo-citisent.png")}
          className="w-[200px] h-[200px]"
          resizeMode="contain"
        />
        <Text className="text-[36px] font-bold text-white tracking-[2px] mt-2">CitiSent</Text>
        <Text className="text-[13px] text-[#7BAFD4] tracking-[1.5px] uppercase">lalagyan pa ng tagline</Text>
      </Animated.View>
    </View>
  );
}
