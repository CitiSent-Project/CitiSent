import { useEffect } from "react";
import { Stack } from "expo-router";
import { View, useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AnimatedSplashLayout } from "../modules/shared";
import { initAuthSession } from "../services/authSession";
import "../globals.css";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  useEffect(() => {
    initAuthSession();
  }, []);

  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}
