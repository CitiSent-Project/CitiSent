import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AttachmentSection from "../../components/createReport/details/AttachmentSection";
import BreadcrumbsNav from "../../components/createReport/details/BreadcrumbsNav";
import IssueReportForm from "../../components/createReport/details/IssueReportForm";
import SubmitReportButton from "../../components/createReport/details/SubmitReportButton";
import PageTopBar from "../../components/layout/PageTopBar";
import RefreshableScrollView from "../../components/ui/RefreshableScrollView";
import { Colors } from "../../constants/colors";
import { getCreateReportIssueById } from "../../constants/createReportIssues";
import usePullToRefresh from "../../hooks/usePullToRefresh";

export default function CreateReportIssueDetailScreen() {
  const { issueId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const normalizedIssueId = Array.isArray(issueId) ? issueId[0] : issueId;
  const issue = getCreateReportIssueById(normalizedIssueId);

  const [issueLocation, setIssueLocation] = useState("");
  const [report, setReport] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshing, onRefresh } = usePullToRefresh();
  const scrollViewRef = useRef(null);
  const inputPositionsRef = useRef({ issueLocation: 0, report: 0 });
  const reportContentHeightRef = useRef(0);

  const canSubmit = issueLocation.trim().length > 0 && report.trim().length > 0;

  function handleInputLayout(field, y) {
    inputPositionsRef.current[field] = y;
  }

  function handleInputFocus(field) {
    const inputY = inputPositionsRef.current[field] ?? 0;
    const targetY = Math.max(0, inputY - 24);

    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
    }, 80);
  }

  function handleReportSizeChange(event) {
    const newHeight = event.nativeEvent.contentSize.height;
    if (newHeight <= reportContentHeightRef.current) return;
    reportContentHeightRef.current = newHeight;

    const reportY = inputPositionsRef.current["report"] ?? 0;

    const targetY = Math.max(0, reportY + newHeight - 20);

    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
    }, 50);
  }

  function handleSubmitReport() {
    if (!canSubmit) {
      Alert.alert("Missing details", "Please provide the issue location and report before submitting.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert("Report submitted", "Your report has been submitted successfully.", [
        {
          text: "OK",
          onPress: () => {
            setIssueLocation("");
            setReport("");
            router.back();
          },
        },
      ]);
    }, 450);
  }

  if (!issue) {
    return (
      <View className="flex-1 items-center justify-center px-5" style={{ backgroundColor: Colors.screen.tabs }}>
        <Text className="mb-2 text-lg font-semibold text-[#111827]">Issue not found</Text>
        <Text className="text-center text-sm text-[#6B7280]">Please go back and select an issue again.</Text>
        <Text className="mt-4 text-sm font-semibold text-[#223D68]" onPress={() => router.back()}>
          Go Back
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ paddingTop: insets.top, backgroundColor: Colors.screen.tabs }}>
      <PageTopBar title="Create Report" />

      <BreadcrumbsNav items={["Create Report", issue.label]} />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <RefreshableScrollView
          ref={scrollViewRef}
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 16,
            paddingBottom: insets.bottom + 36,
            flexGrow: 1,
          }}
        >
          <AttachmentSection />

          <IssueReportForm
            requestType={issue.label}
            issueLocation={issueLocation}
            report={report}
            onChangeIssueLocation={setIssueLocation}
            onChangeReport={setReport}
            onInputLayout={handleInputLayout}
            onInputFocus={handleInputFocus}
            onReportSizeChange={handleReportSizeChange}
          />

          <SubmitReportButton onPress={handleSubmitReport} disabled={!canSubmit} loading={isSubmitting} />
        </RefreshableScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
