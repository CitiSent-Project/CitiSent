import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AttachmentSection from "../../components/createReport/details/AttachmentSection";
import BreadcrumbsNav from "../../components/createReport/details/BreadcrumbsNav";
import IssueReportForm from "../../components/createReport/details/IssueReportForm";
import SubmitReportButton from "../../components/createReport/details/SubmitReportButton";
import PageTopBar from "../../components/layout/PageTopBar";
import { getCreateReportIssueById } from "../../constants/createReportIssues";

export default function CreateReportIssueDetailScreen() {
  const { issueId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const normalizedIssueId = Array.isArray(issueId) ? issueId[0] : issueId;
  const issue = getCreateReportIssueById(normalizedIssueId);

  const [issueLocation, setIssueLocation] = useState("");
  const [report, setReport] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = issueLocation.trim().length > 0 && report.trim().length > 0;

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
      <View className="flex-1 items-center justify-center bg-white px-5">
        <Text className="mb-2 text-lg font-semibold text-[#111827]">Issue not found</Text>
        <Text className="text-center text-sm text-[#6B7280]">Please go back and select an issue again.</Text>
        <Text className="mt-4 text-sm font-semibold text-[#223D68]" onPress={() => router.back()}>
          Go Back
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <PageTopBar title="Create Report" />

      <BreadcrumbsNav items={["Create Report", issue.label]} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 28 }}
      >
        <AttachmentSection />

        <IssueReportForm
          requestType={issue.label}
          issueLocation={issueLocation}
          report={report}
          onChangeIssueLocation={setIssueLocation}
          onChangeReport={setReport}
        />

        <SubmitReportButton onPress={handleSubmitReport} disabled={!canSubmit} loading={isSubmitting} />
      </ScrollView>
    </View>
  );
}
