import { useEffect, useRef } from "react";
import { Stack } from "expo-router";
import { View, useColorScheme, AppState, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SystemUI from "expo-system-ui";
import { AnimatedSplashLayout } from "../modules/shared";
import { initAuthSession } from "../services/authSession";
import { AdminMessageProvider } from "../contexts/AdminMessageContext";
import "../globals.css";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const appState = useRef(AppState.currentState);
  
  useEffect(() => {
    initAuthSession().catch(() => {
      // Auth init failed — admin message state will initialize lazily
    });
    
    // Workaround for Android edge-to-edge mode not reapplying 
    // the navigation bar settings when it resumes from the background.
    if (Platform.OS === 'android') {
      const bgColor = colorScheme === "dark" ? "#000000" : "#ffffff";
      SystemUI.setBackgroundColorAsync(bgColor);
      const subscription = AppState.addEventListener("change", (nextAppState) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          SystemUI.setBackgroundColorAsync(colorScheme === "dark" ? "#000000" : "#ffffff");
        }
        appState.current = nextAppState;
      });

      return () => {
        subscription.remove();
      };
    }
  }, [colorScheme]);

  return (
    <SafeAreaProvider>
      <AdminMessageProvider>
        <View className="flex-1" style={{ backgroundColor: colorScheme === "dark" ? "#000000" : "#ffffff" }}>
          <StatusBar 
            style={colorScheme === "dark" ? "light" : "dark"} 
            backgroundColor={colorScheme === "dark" ? "#000000" : "#ffffff"} 
          />
          <AnimatedSplashLayout>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="auth/Login" />
              <Stack.Screen name="auth/LoginForm" />
              <Stack.Screen name="auth/CreateAccount" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="create-report/[issueId]" />
              <Stack.Screen name="profile/reports" />
              <Stack.Screen name="profile/notifications" />
              <Stack.Screen name="profile/edit" />
              <Stack.Screen name="profile/settings" />
            </Stack>
          </AnimatedSplashLayout>
        </View>
      </AdminMessageProvider>
    </SafeAreaProvider>
  );
}

