import { Text, View } from "react-native";
import {
  MyReportsList,
  ReportsFeedSkeleton,
  SectionTitle,
  MyReportsTopBar,
  useMyReports,
} from "../../modules/myReports";
import { RefreshableScrollView, usePullToRefresh, Colors } from "../../modules/shared";
import { AuthCityFooter } from "../../modules/auth";

export default function MyReportsScreen() {
  const { reports, reloadMyReports, isInitialLoading } = useMyReports();

  const { refreshing, onRefresh } = usePullToRefresh(reloadMyReports);

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.screen.tabs }}>
      <AuthCityFooter backgroundColor={Colors.screen.tabs} />

      <MyReportsTopBar />

      <RefreshableScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-44 pt-4"
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        {isInitialLoading ? (
          <ReportsFeedSkeleton />
        ) : (
          <>
            <SectionTitle title="My Submitted Reports" />
            <Text className="mb-3 text-sm" style={{ color: Colors.text.secondary }}>
              Track the status and details of every concern you have submitted.
            </Text>

            <MyReportsList reports={reports} />
          </>
        )}
      </RefreshableScrollView>
    </View>
  );
}
