import { useMemo } from "react";
import { Text, View } from "react-native";
import { AuthCityFooter } from "../../modules/auth";
import {
  CREATE_REPORT_ISSUES,
  CreateReportTopBar,
  IssueGrid,
  buildIssueOptionsFromDepartments,
} from "../../modules/createReport";
import { Button, Colors } from "../../modules/shared";
import useDepartments from "../../hooks/useDepartments";

export default function CreateReportScreen() {
  const { departments, error, isInitialLoading, reloadDepartments } = useDepartments();

  const { issues, isFallback } = useMemo(() => {
    const fromApi = buildIssueOptionsFromDepartments(departments);

    if (fromApi.length > 0) {
      return { issues: fromApi, isFallback: false };
    }

    if (error) {
      return { issues: CREATE_REPORT_ISSUES, isFallback: true };
    }

    return { issues: [], isFallback: false };
  }, [departments, error]);

  const showEmptyState = !isInitialLoading && issues.length === 0;

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.screen.tabs }}>
      <AuthCityFooter backgroundColor={Colors.screen.tabs} />

      <CreateReportTopBar />

      <View className="flex-1 px-3 pt-4" style={{ paddingBottom: 160 }}>
        <Text className="mb-4 text-3xl font-extrabold" style={{ color: Colors.text.primary }}>Select an Issue</Text>
        <Text className="mb-4 text-sm" style={{ color: Colors.text.slate }}>Click the selected issue to continue</Text>

        {isInitialLoading ? (
          <Text className="mb-4 text-sm" style={{ color: Colors.text.slate }}>
            Loading agencies...
          </Text>
        ) : null}

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
      </View>
    </View>
  );
}
