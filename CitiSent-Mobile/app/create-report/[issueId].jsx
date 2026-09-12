import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
  ActivityIndicator,
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
import { GuestVerificationModal, AuthLegalConsent } from "../../modules/auth";
import { isGuestUser } from "../../services/authSession";
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
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
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
  const [isGuestOtpModalVisible, setIsGuestOtpModalVisible] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const { refreshing, onRefresh } = usePullToRefresh(reloadDepartments);
  const scrollViewRef = useRef(null);
  const inputPositionsRef = useRef({ issueLocation: 0, report: 0 });
  const reportContentHeightRef = useRef(0);

  const isWithinStoTomas = (lat, lon) => {
    if (lat == null || lon == null) return false;
    return lat >= 13.9796305 && lat <= 14.1473362 && lon >= 121.1250228 && lon <= 121.2319705;
  };

  // Enforce backend validation: location min 1, description min 10, issueType min 1, coordinates within Sto. Tomas
  const canSubmit =
    issue
      ? issueLocation.trim().length > 0 &&
        report.trim().length >= 10 &&
        latitude !== null &&
        longitude !== null &&
        isWithinStoTomas(Number(latitude), Number(longitude)) &&
        (!isGuestUser() || (agreeTerms && agreePrivacy))
      : false;

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
    if (!issue) return;
    if (issueLocation.trim().length === 0) {
      showModal("error", "Missing details", "Please provide the issue location.");
      return;
    }
    if (latitude === null || longitude === null) {
      showModal("error", "Invalid Location", "Please select a verified location from the suggestions or use your current location.");
      return;
    }
    if (!isWithinStoTomas(Number(latitude), Number(longitude))) {
      showModal("error", "Outside Allowed Area", "The selected location is outside the official boundaries of Sto. Tomas City, Batangas.");
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

    // If guest user, always show Turnstile CAPTCHA before submitting
    if (isGuestUser()) {
      setIsGuestOtpModalVisible(true);
      return;
    }

    await executeSubmitReport(null);
  }

  async function executeSubmitReport(turnstileToken) {
    setIsSubmitting(true);
    try {
      let attachmentUrl;

      if (imageUri) {
        attachmentUrl = await reportsApi.uploadImage(imageUri);
      }

      await reportsApi.createReport({
        issueType: issue.name || issue.label,
        location: issueLocation,
        latitude,
        longitude,
        description: report,
        ...(attachmentUrl ? { attachmentUrl } : {}),
        ...(turnstileToken ? { turnstileToken } : {}),
      });
      setIsSubmitting(false);
      showModal(
        "success",
        "Report submitted",
        "Your report has been submitted successfully.",
        () => {
          setIssueLocation("");
          setLatitude(null);
          setLongitude(null);
          setReport("");
          setImageUri(null);
          router.back();
        }
      );
    } catch (error) {
      setIsSubmitting(false);

      const isCaptchaRequired =
        error?.code === "CAPTCHA_REQUIRED" ||
        String(error?.message || "").toLowerCase().includes("complete the verification");

      const isCaptchaInvalid =
        error?.code === "CAPTCHA_INVALID" ||
        String(error?.message || "").toLowerCase().includes("verification failed");

      if (isCaptchaRequired || isCaptchaInvalid) {
        setIsGuestOtpModalVisible(true);
        return;
      }

      showModal(
        "error",
        "Submission failed",
        error?.message || "Unable to submit report. Please try again."
      );
    }
  }

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.screen.tabs }}>
      <PageTopBar title="Create Report" />

      <BreadcrumbsNav items={["Create Report", issue?.label || "Loading..."]} />

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
          {isInitialLoading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text className="mt-4 text-base font-semibold" style={{ color: Colors.text.primary }}>
                Loading issue details...
              </Text>
              <Text className="mt-1 text-sm text-center" style={{ color: Colors.text.slate }}>
                Please wait while we fetch the latest agency configuration.
              </Text>
            </View>
          ) : !issue ? (
            <View className="flex-1 items-center justify-center py-20 px-4">
              <Text className="mb-2 text-lg font-semibold" style={{ color: Colors.text.primary }}>
                Issue not found
              </Text>
              <Text className="text-center text-sm" style={{ color: Colors.text.slate }}>
                Please go back and select a department again.
              </Text>
              {isFallback ? (
                <View className="mt-4 w-full">
                  <Button title="Retry" onPress={reloadDepartments} variant="outline" />
                </View>
              ) : null}
              <Text
                className="mt-6 text-sm font-semibold text-[#223D68]"
                onPress={() => router.back()}
              >
                Go Back
              </Text>
            </View>
          ) : (
            <>
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
                latitude={latitude}
                longitude={longitude}
                onLocationSelected={(address, lat, lon) => {
                  setIssueLocation(address);
                  setLatitude(lat);
                  setLongitude(lon);
                }}
              />

              {isGuestUser() && (
                <View className="mt-2 w-full">
                  <AuthLegalConsent
                    agreeTerms={agreeTerms}
                    onToggleTerms={() => setAgreeTerms(!agreeTerms)}
                    agreePrivacy={agreePrivacy}
                    onTogglePrivacy={() => setAgreePrivacy(!agreePrivacy)}
                  />
                </View>
              )}

              <SubmitReportButton
                onPress={handleSubmitReport}
                disabled={!canSubmit}
                loading={isSubmitting}
              />
            </>
          )}
        </RefreshableScrollView>
      </KeyboardAvoidingView>

      <FeedbackModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={closeModal}
      />

      <GuestVerificationModal
        visible={isGuestOtpModalVisible}
        onClose={() => setIsGuestOtpModalVisible(false)}
        onVerified={(token) => {
          setIsGuestOtpModalVisible(false);
          executeSubmitReport(token);
        }}
      />
    </View>

  );
}
