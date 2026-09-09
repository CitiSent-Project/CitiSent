import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, Text, View, useWindowDimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import {
  AuthActionButton,
  AuthBrandMark,
  AuthCityFooter,
  authApi,
} from "../../modules/auth";
import { useSplashTransition } from "../../modules/shared";

export default function LoginScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const { isSplashTransitionDone } = useSplashTransition();

  const getLogoStartOffset = () => Math.max(height * 0.26, 130);

  const logoTranslateY = useRef(new Animated.Value(getLogoStartOffset())).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(50)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const animationRef = useRef(null);

  useEffect(() => {
    const logoStartOffset = getLogoStartOffset();

    // Keep the screen in its pre-animation state while splash is still visible.
    logoTranslateY.setValue(logoStartOffset);
    logoOpacity.setValue(0);
    contentTranslateY.setValue(Math.max(height * 0.08, 40));
    contentOpacity.setValue(0);

    if (!isSplashTransitionDone) {
      return;
    }

    animationRef.current = Animated.sequence([
      Animated.parallel([
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 760,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 440,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 560,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]);

    animationRef.current.start();

    return () => {
      animationRef.current?.stop();
    };
  }, [contentOpacity, contentTranslateY, height, isSplashTransitionDone, logoOpacity, logoTranslateY]);

  const handleLogin = () => {
    router.push("/auth/LoginForm");
  };

  const handleCreateAccount = () => {
    router.push("/auth/CreateAccount");
  };

  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const handleContinueAsGuest = async () => {
    if (isGuestLoading) return;
    setIsGuestLoading(true);
    try {
      await authApi.continueAsGuest();
      router.replace("/(tabs)");
    } catch {
      router.replace("/(tabs)");
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#1B2D4F]">
      <StatusBar style="light" />

      <AuthCityFooter />

      <View className="flex-1 px-10">
        <Animated.View
          className="items-center"
          style={{
            paddingTop: Math.max(height * 0.1, 60),
            opacity: logoOpacity,
            transform: [{ translateY: logoTranslateY }],
          }}
        >
          <AuthBrandMark />
        </Animated.View>

        <Animated.View
          style={{
            marginTop: Math.max(height * 0.11, 60),
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslateY }],
          }}
        >
          <Text className="text-center text-[46px] font-normal text-[#CFDAEA]">Welcome!</Text>

          <View className="mt-10 w-full">
            <AuthActionButton label="Create Account" variant="primary" onPress={handleCreateAccount} />
            <AuthActionButton label="Login" variant="outline" onPress={handleLogin} />

            <View className="mt-3 items-center">
              <Pressable
                onPress={handleContinueAsGuest}
                disabled={isGuestLoading}
                className="py-2.5 px-4"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Continue as Guest"
              >
                <Text className="text-center text-sm font-semibold text-[#93C5FD]">
                  {isGuestLoading ? "Entering as Guest..." : "Continue as Guest →"}
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
