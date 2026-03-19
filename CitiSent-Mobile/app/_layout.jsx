import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { AnimatedSplashLayout } from "../modules/shared";
import "../globals.css";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}
