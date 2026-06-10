import { useMemo, useState, useCallback } from "react";
import { Text, View, ScrollView, RefreshControl } from "react-native";
import { AuthCityFooter } from "../../modules/auth";
import {
  CREATE_REPORT_ISSUES,
  CreateReportTopBar,
  IssueGrid,
  buildIssueOptionsFromDepartments,
} from "../../modules/createReport";
import { Button, Colors, SkeletonBlock } from "../../modules/shared";
import useDepartments from "../../hooks/useDepartments";

function IssueGridSkeleton() {
  return (
    <View className="flex-row flex-wrap justify-between">
      {Array.from({ length: 9 }).map((_, index) => (
        <View
          key={index}
          className="mb-3 basis-[31.5%] rounded-2xl px-2 py-3 items-center justify-center"
          style={{ backgroundColor: Colors.ui.issueCardSoft }}
        >
          <SkeletonBlock className="h-20 w-20 rounded-full" />
          <View className="mt-3 w-full items-center">
            <SkeletonBlock className="h-3 w-4/5 rounded" />
            <SkeletonBlock className="mt-1 h-3 w-1/2 rounded" />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function CreateReportScreen() {
  const { departments, error, isInitialLoading, reloadDepartments } = useDepartments();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reloadDepartments();
    setRefreshing(false);
  }, [reloadDepartments]);

  const { issues, isFallback } = useMemo(() => {
    const fromApi = buildIssueOptionsFromDepartments(departments);

    if (fromApi.length > 0) {
      const sortedApi = [...fromApi].sort((a, b) => a.label.localeCompare(b.label));
      return { issues: sortedApi, isFallback: false };
    }

    if (error) {
      const sortedFallback = [...CREATE_REPORT_ISSUES].sort((a, b) => a.label.localeCompare(b.label));
      return { issues: sortedFallback, isFallback: true };
    }

    return { issues: [], isFallback: false };
  }, [departments, error]);

  const showEmptyState = !isInitialLoading && issues.length === 0;

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.screen.tabs }}>
      <AuthCityFooter backgroundColor={Colors.screen.tabs} />

      <CreateReportTopBar />

      <ScrollView 
        className="flex-1 px-3 pt-4" 
        contentContainerStyle={{ paddingBottom: 160 }} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text className="mb-4 text-3xl font-extrabold" style={{ color: Colors.text.primary }}>Select an Issue</Text>
        <Text className="mb-4 text-sm" style={{ color: Colors.text.slate }}>Select your Local Government Unit (LGU) to continue.</Text>

        {isInitialLoading ? <IssueGridSkeleton /> : null}

        {isFallback ? (
          <View className="mb-4 rounded-2xl bg-white px-4 py-3 shadow-sm">
            <Text className="text-sm font-semibold" style={{ color: Colors.text.primary }}>
              Showing offline agencies list.
            </Text>
            <Text className="mt-1 text-xs" style={{ color: Colors.text.slate }}>
              We could not reach the server. Retry to load the latest agencies.
            </Text>
            <View className="mt-3">
              <Button title="Retry" onPress={reloadDepartments} variant="outline" />
            </View>
          </View>
        ) : null}

        {showEmptyState ? (
          <View className="rounded-2xl bg-white px-4 py-3 shadow-sm">
            <Text className="text-sm font-semibold" style={{ color: Colors.text.primary }}>
              No agencies available.
            </Text>
            <Text className="mt-1 text-xs" style={{ color: Colors.text.slate }}>
              Please try again later or contact the administrator.
            </Text>
          </View>
        ) : null}

        {issues.length > 0 ? <IssueGrid issues={issues} /> : null}
      </ScrollView>
    </View>
  );
}
