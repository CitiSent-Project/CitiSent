import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FeedbackModal from "../../components/ui/FeedbackModal";
import {
  AttachmentSection,
  BreadcrumbsNav,
  IssueReportForm,
  SubmitReportButton,
  CREATE_REPORT_ISSUES,
  buildIssueOptionsFromDepartments,
  getCreateReportIssueById,
} from "../../modules/createReport";
import {
  Button,
  PageTopBar,
  RefreshableScrollView,
  Colors,
  usePullToRefresh,
} from "../../modules/shared";
import useDepartments from "../../hooks/useDepartments";
import { reportsApi } from "../../services/reports";

export default function CreateReportIssueDetailScreen() {
  const { issueId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const normalizedIssueId = Array.isArray(issueId) ? issueId[0] : issueId;
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

  const issue = useMemo(
    () => getCreateReportIssueById(normalizedIssueId, issues),
    [issues, normalizedIssueId]
  );

  const [issueLocation, setIssueLocation] = useState("");
  const [report, setReport] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    type: "info",
    title: "",
    message: "",
    onCloseAction: null,
  });
  const { refreshing, onRefresh } = usePullToRefresh(reloadDepartments);
  const scrollViewRef = useRef(null);
  const inputPositionsRef = useRef({ issueLocation: 0, report: 0 });
  const reportContentHeightRef = useRef(0);

  // Enforce backend validation: location min 1, description min 10, issueType min 1
  const canSubmit =
    issueLocation.trim().length > 0 && report.trim().length >= 10;

  function showModal(type, title, message, onCloseAction = null) {
    setModalConfig({ visible: true, type, title, message, onCloseAction });
  }

  function closeModal() {
    const action = modalConfig.onCloseAction;
    setModalConfig((prev) => ({ ...prev, visible: false }));
    if (action) {
      action();
    }
  }

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

  async function handleSubmitReport() {
    if (issueLocation.trim().length === 0) {
      showModal("error", "Missing details", "Please provide the issue location.");
      return;
    }
    if (report.trim().length < 10) {
      showModal(
        "error",
        "Description too short",
        "Please provide a more detailed report (at least 10 characters)."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      let attachmentUrl;

      if (imageUri) {
        attachmentUrl = await reportsApi.uploadImage(imageUri);
      }

      await reportsApi.createReport({
        issueType: issue.name || issue.label,
        location: issueLocation,
        description: report,
        ...(attachmentUrl ? { attachmentUrl } : {}),
      });
      setIsSubmitting(false);
      showModal(
        "success",
        "Report submitted",
        "Your report has been submitted successfully.",
        () => {
          setIssueLocation("");
          setReport("");
          setImageUri(null);
          router.back();
        }
      );
    } catch (error) {
      setIsSubmitting(false);
      showModal(
        "error",
        "Submission failed",
        error?.message || "Unable to submit report. Please try again."
      );
    }
  }

  if (isInitialLoading && !issue) {
    return (
      <View
        className="flex-1 items-center justify-center px-5"
        style={{ backgroundColor: Colors.screen.tabs }}
      >
        <Text className="mb-2 text-lg font-semibold text-[#111827]">
          Loading issue...
        </Text>
        <Text className="text-center text-sm text-[#6B7280]">
          Please wait while we fetch the latest agencies.
        </Text>
      </View>
    );
  }

  if (!issue) {
    return (
      <View
        className="flex-1 items-center justify-center px-5"
        style={{ backgroundColor: Colors.screen.tabs }}
      >
        <Text className="mb-2 text-lg font-semibold text-[#111827]">
          Issue not found
        </Text>
        <Text className="text-center text-sm text-[#6B7280]">
          Please go back and select an issue again.
        </Text>
        {isFallback ? (
          <View className="mt-4 w-full">
            <Button title="Retry" onPress={reloadDepartments} variant="outline" />
          </View>
        ) : null}
        <Text
          className="mt-4 text-sm font-semibold text-[#223D68]"
          onPress={() => router.back()}
        >
          Go Back
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.screen.tabs }}>
      <PageTopBar title="Create Report" />

      <BreadcrumbsNav items={["Create Report", issue.label]} />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <RefreshableScrollView
          ref={scrollViewRef}
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 16,
            paddingBottom: insets.bottom + 36,
            flexGrow: 1,
          }}
        >
          <AttachmentSection imageUri={imageUri} onImageSelect={setImageUri} />

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

          <SubmitReportButton
            onPress={handleSubmitReport}
            disabled={!canSubmit}
            loading={isSubmitting}
          />
        </RefreshableScrollView>
      </KeyboardAvoidingView>

      <FeedbackModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={closeModal}
      />
    </View>
  );
}
