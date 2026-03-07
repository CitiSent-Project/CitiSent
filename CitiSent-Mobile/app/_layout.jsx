import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import AnimatedSplashLayout from "../components/layout/AnimatedSplashLayout";
import "../globals.css";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AnimatedSplashLayout>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="login-form" />
          <Stack.Screen name="create-account" />
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
