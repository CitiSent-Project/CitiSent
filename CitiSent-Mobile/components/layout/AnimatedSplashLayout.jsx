import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import AuthBrandMark from "../auth/AuthBrandMark";

const SplashTransitionContext = createContext({
  isSplashTransitionDone: false,
});

export function useSplashTransition() {
  return useContext(SplashTransitionContext);
}

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore if the splash screen was already prevented from auto-hiding.
});

export default function AnimatedSplashLayout({ children }) {
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.88)).current;
  const logoTranslateY = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const animationRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const runSplashAnimation = async () => {
      await SplashScreen.hideAsync().catch(() => {
        // Ignore hide errors to avoid blocking the app shell.
      });

      animationRef.current = Animated.sequence([
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 550,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(logoScale, {
            toValue: 1,
            friction: 7,
            tension: 75,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(280),
        Animated.parallel([
          Animated.timing(overlayOpacity, {
            toValue: 0,
            duration: 560,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(logoOpacity, {
            toValue: 0.24,
            duration: 420,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(logoScale, {
            toValue: 0.96,
            duration: 500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(logoTranslateY, {
            toValue: -18,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]);

      animationRef.current.start(({ finished }) => {
        if (finished && isMounted) {
          setIsSplashVisible(false);
        }
      });
    };

    runSplashAnimation();

    return () => {
      isMounted = false;
      animationRef.current?.stop();
    };
  }, [logoOpacity, logoScale, logoTranslateY, overlayOpacity]);

  return (
    <SplashTransitionContext.Provider value={{ isSplashTransitionDone: !isSplashVisible }}>
      <View style={styles.container}>
        {children}

        {isSplashVisible ? (
          <Animated.View pointerEvents="none" style={[styles.overlay, { opacity: overlayOpacity }]}>
            <StatusBar style="light" />
            <Animated.View
              style={[
                styles.logoWrap,
                { opacity: logoOpacity, transform: [{ translateY: logoTranslateY }, { scale: logoScale }] },
              ]}
            >
              <AuthBrandMark size={130} />
              <Text style={styles.brandText}>CitiSent</Text>
            </Animated.View>
          </Animated.View>
        ) : null}
      </View>
    </SplashTransitionContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1B2D4F",
  },
  logoWrap: {
    alignItems: "center",
  },
  brandText: {
    marginTop: 10,
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: 1.8,
  },
});
