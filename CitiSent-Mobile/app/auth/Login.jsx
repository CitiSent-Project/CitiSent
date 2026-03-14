import { useEffect, useRef } from "react";
import { Animated, Easing, Text, View, useWindowDimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import AuthActionButton from "../../components/auth/AuthActionButton";
import AuthBrandMark from "../../components/auth/AuthBrandMark";
import AuthCityFooter from "../../components/auth/AuthCityFooter";
import { useSplashTransition } from "../../components/layout/AnimatedSplashLayout";

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

          <View className="mt-12 w-full">
            <AuthActionButton label="Create Account" variant="primary" onPress={handleCreateAccount} />
            <AuthActionButton label="Login" variant="outline" onPress={handleLogin} />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
