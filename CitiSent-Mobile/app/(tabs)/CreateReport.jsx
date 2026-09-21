import { useMemo, useState, useCallback } from "react";
import { Text, View, ScrollView, RefreshControl, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthCityFooter } from "../../modules/auth";
import {
  CREATE_REPORT_ISSUES,
  CreateReportTopBar,
  IssueGrid,
  LguSearchBar,
  buildIssueOptionsFromDepartments,
  filterLguIssues,
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
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredIssues = useMemo(
    () => filterLguIssues(issues, searchQuery),
    [issues, searchQuery]
  );

  const showEmptyState = !isInitialLoading && issues.length === 0;

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.screen.tabs }}>
      <AuthCityFooter backgroundColor={Colors.screen.tabs} />

      <CreateReportTopBar />

      <ScrollView 
        className="flex-1 px-3 pt-4" 
        contentContainerStyle={{ paddingBottom: 160 }} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text className="mb-1 text-3xl font-extrabold" style={{ color: Colors.text.primary }}>
          Select a Department
        </Text>
        <Text className="mb-4 text-sm" style={{ color: Colors.text.slate }}>
          Select your Local Government Unit (LGU) to continue.
        </Text>

        <LguSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          disabled={isInitialLoading}
        />

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

        {!isInitialLoading && searchQuery.trim().length > 0 && filteredIssues.length === 0 && issues.length > 0 ? (
          <View
            className="mb-4 items-center justify-center rounded-2xl bg-white px-6 py-8 shadow-sm border"
            style={{ borderColor: "#E2E8F0" }}
          >
            <View
              className="mb-3 h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: "#F1F5F9" }}
            >
              <Ionicons name="search-outline" size={24} color={Colors.text.secondary} />
            </View>
            <Text className="text-base font-bold text-center" style={{ color: Colors.text.primary }}>
              No LGU offices found
            </Text>
            <Text className="mt-1 text-center text-xs" style={{ color: Colors.text.slate }}>
              No office matches "{searchQuery.trim()}". Try another search term.
            </Text>
            <Pressable
              onPress={() => setSearchQuery("")}
              className="mt-4 rounded-xl border px-4 py-2"
              style={{ borderColor: Colors.primary }}
              accessibilityRole="button"
              accessibilityLabel="Clear search query"
            >
              <Text className="text-xs font-semibold" style={{ color: Colors.primary }}>
                Clear Search
              </Text>
            </Pressable>
          </View>
        ) : null}

        {filteredIssues.length > 0 ? <IssueGrid issues={filteredIssues} /> : null}
      </ScrollView>
    </View>
  );
}
