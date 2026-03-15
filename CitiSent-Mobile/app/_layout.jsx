import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AnimatedSplashLayout } from "../modules/shared";
import "../globals.css";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
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
          <Stack.Screen name="profile/settings" />
        </Stack>
      </AnimatedSplashLayout>
    </SafeAreaProvider>
  );
}
