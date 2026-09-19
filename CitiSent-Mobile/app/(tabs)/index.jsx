import { useCallback, useEffect, useState } from "react";
import { View, BackHandler, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  EmergencyServicesRow,
  HomeHeader,
  HomeHero,
  LatestReportCard,
  SectionHeader,
  reportsApi,
} from "../../modules/home";
import { RefreshableScrollView, usePullToRefresh, Colors, ConfirmationModal } from "../../modules/shared";
import { AuthCityFooter, authApi } from "../../modules/auth";
import YourLatestReportSection from "../../components/home/YourLatestReportSection";

export default function HomeScreen() {
  const router = useRouter();
  const [latestReport, setLatestReport] = useState(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const loadLatestReport = useCallback(async () => {
    const report = await reportsApi.getLatestHomeReport();
    setLatestReport(report);
  }, []);

  const { refreshing, onRefresh } = usePullToRefresh(loadLatestReport);

  useEffect(() => {
    loadLatestReport();
  }, [loadLatestReport]);

  // Intercept the Android hardware back button while this screen is focused.
  // This prevents the user from accidentally navigating back to the Login screen
  // when they are at the root of the authenticated stack.
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;

      const onBackPress = () => {
        setShowLogoutDialog(true);
        // Return true to consume the event and prevent default back navigation.
        return true;
      };

      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const handleCancelLogout = () => {
    setShowLogoutDialog(false);
  };

  const handleConfirmLogout = () => {
    setShowLogoutDialog(false);
    authApi.logout();
    router.replace("/auth/Login");
  };

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.screen.tabs }}>
      <AuthCityFooter backgroundColor={Colors.screen.tabs} />

      <RefreshableScrollView
        className="flex-1"
        contentContainerClassName="pb-44"
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        <HomeHeader />

        <View className="pt-3">
          <HomeHero />

          <View className="px-4">
            <SectionHeader title="Emergency Hotlines" />
            <EmergencyServicesRow />

            <YourLatestReportSection title="Your Latest Report(s)" />
            <LatestReportCard report={latestReport ?? undefined} />

            <View className="h-5" />
          </View>
        </View>
      </RefreshableScrollView>

      {/* Android back button logout confirmation */}
      <ConfirmationModal
        visible={showLogoutDialog}
        type="danger"
        title="Log Out?"
        message="Do you want to log out of CitiSent?"
        cancelText="Cancel"
        confirmText="Log Out"
        onCancel={handleCancelLogout}
        onConfirm={handleConfirmLogout}
      />
    </View>
  );
}
