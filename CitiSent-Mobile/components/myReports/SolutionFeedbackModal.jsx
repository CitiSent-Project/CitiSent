import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  LayoutAnimation,
  UIManager,
  Dimensions,
  StatusBar as RNStatusBar,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, formatDateTime } from "../../modules/shared";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  try {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  } catch {}
}

const RATING_LABELS = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

export default function SolutionFeedbackModal({
  visible,
  report,
  onClose,
  onSubmitFeedback,
}) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const topInset = Math.max(
    insets.top,
    Platform.OS === "android" ? RNStatusBar.currentHeight || 24 : 0,
  );

  const existingFeedback = report?.feedback || null;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submittedResult, setSubmittedResult] = useState(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [androidBottomOffset, setAndroidBottomOffset] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const scrollViewRef = useRef(null);
  const inputRef = useRef(null);
  const isInputFocusedRef = useRef(false);
  const feedbackSectionYRef = useRef(0);
  const commentContentHeightRef = useRef(0);
  const containerHeightRef = useRef(0);
  const scrollTimersRef = useRef([]);

  const clearScrollTimers = useCallback(() => {
    scrollTimersRef.current.forEach((timerId) => clearTimeout(timerId));
    scrollTimersRef.current = [];
  }, []);

  const scrollToFeedbackInput = useCallback(
    (animated = true) => {
      clearScrollTimers();

      const performScroll = () => {
        if (!scrollViewRef.current) return;
        scrollViewRef.current.scrollToEnd({ animated });
      };

      scrollTimersRef.current.push(setTimeout(performScroll, 60));
      scrollTimersRef.current.push(setTimeout(performScroll, 220));
    },
    [clearScrollTimers],
  );

  useEffect(() => {
    return () => {
      clearScrollTimers();
    };
  }, [clearScrollTimers]);

  useEffect(() => {
    if (visible) {
      setRating(existingFeedback?.rating || 0);
      setComment(existingFeedback?.comment || "");
      setErrorMessage("");
      setIsSubmitting(false);
      setSubmittedResult(null);
      commentContentHeightRef.current = 0;
    } else {
      clearScrollTimers();
      isInputFocusedRef.current = false;
      setKeyboardVisible(false);
      setKeyboardHeight(0);
      setAndroidBottomOffset(0);
      Keyboard.dismiss();
    }
  }, [visible, report?.id, existingFeedback, clearScrollTimers]);

  useEffect(() => {
    if (!visible) return;

    const handleKeyboardShow = (e) => {
      const endCoords = e?.endCoordinates;
      const rawHeight = endCoords?.height || 0;
      const screenY = endCoords?.screenY;
      const screenH = Math.max(
        Dimensions.get("screen").height,
        Dimensions.get("window").height,
        windowHeight,
      );
      const measuredContainerH = containerHeightRef.current || windowHeight;

      let nextAndroidOffset = 0;
      if (Platform.OS === "android") {
        if (typeof screenY === "number" && screenY > 0) {
          if (measuredContainerH > screenY + 20) {
            nextAndroidOffset = Math.max(0, measuredContainerH - screenY);
          } else {
            nextAndroidOffset = 0;
          }
        } else if (rawHeight > 0) {
          nextAndroidOffset = rawHeight + (insets.bottom || 0);
        }
      }

      const effectiveKbHeight =
        rawHeight > 0
          ? rawHeight
          : typeof screenY === "number" && screenY > 0 && screenY < screenH
            ? screenH - screenY
            : nextAndroidOffset;

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardVisible(true);
      setKeyboardHeight(effectiveKbHeight);
      setAndroidBottomOffset(nextAndroidOffset);

      if (isInputFocusedRef.current) {
        scrollToFeedbackInput(true);
      }
    };

    const handleKeyboardHide = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardVisible(false);
      setKeyboardHeight(0);
      setAndroidBottomOffset(0);
    };

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const subscriptions = [
      Keyboard.addListener(showEvent, handleKeyboardShow),
      Keyboard.addListener(hideEvent, handleKeyboardHide),
    ];

    if (Platform.OS === "android") {
      try {
        subscriptions.push(
          Keyboard.addListener("keyboardWillShow", handleKeyboardShow),
        );
        subscriptions.push(
          Keyboard.addListener("keyboardWillHide", handleKeyboardHide),
        );
      } catch {}
    }

    return () => {
      subscriptions.forEach((sub) => sub.remove());
    };
  }, [visible, insets.bottom, windowHeight, scrollToFeedbackInput]);

  if (!report) return null;

  const isCompletedReport =
    String(report.status || "").trim().toLowerCase() === "completed" ||
    String(report.rawStatus || "").trim().toLowerCase() === "resolved";

  const displayFeedback = submittedResult || existingFeedback;
  const isReadOnly = Boolean(displayFeedback);

  const effectiveContainerHeight = containerHeight > 0 ? containerHeight : windowHeight;
  const visibleAreaHeight = keyboardVisible
    ? Platform.OS === "ios"
      ? windowHeight - keyboardHeight
      : effectiveContainerHeight - androidBottomOffset
    : effectiveContainerHeight;

  const availableHeight = keyboardVisible
    ? Math.max(250, visibleAreaHeight - topInset - 8)
    : Math.min(windowHeight * 0.9, effectiveContainerHeight - topInset - 16);

  const handleCloseModal = () => {
    if (isSubmitting) return;
    Keyboard.dismiss();
    onClose?.();
  };

  const handleBackdropPress = () => {
    if (keyboardVisible || isInputFocusedRef.current) {
      Keyboard.dismiss();
    }
  };

  const handleCommentSizeChange = (event) => {
    const newHeight = event?.nativeEvent?.contentSize?.height || 0;
    if (newHeight <= commentContentHeightRef.current) {
      commentContentHeightRef.current = newHeight;
      return;
    }
    commentContentHeightRef.current = newHeight;

    if (isInputFocusedRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  };

  const handleSubmit = async () => {
    if (isReadOnly || isSubmitting) return;

    Keyboard.dismiss();

    if (!isCompletedReport) {
      setErrorMessage(
        "Feedback can only be submitted once the report has been marked as resolved.",
      );
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      setErrorMessage("Please select a star rating from 1 to 5.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await onSubmitFeedback?.(report.id, {
        rating,
        comment: comment.trim(),
      });

      const savedFeedback = result?.feedback || {
        rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      };

      setSubmittedResult(savedFeedback);
    } catch (err) {
      setErrorMessage(
        err?.message || "Failed to submit your feedback. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="slide"
      onRequestClose={() => {
        if (keyboardVisible || isInputFocusedRef.current) {
          Keyboard.dismiss();
          return;
        }
        handleCloseModal();
      }}
    >
      <View
        className="flex-1 bg-black/50"
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0) {
            containerHeightRef.current = h;
            setContainerHeight(h);
          }
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
          className="flex-1 justify-end"
          style={{
            paddingBottom: Platform.OS === "android" ? androidBottomOffset : 0,
          }}
        >
          {/* Backdrop tap area: dismisses keyboard without accidentally closing the form */}
          <Pressable
            className="flex-1 w-full"
            onPress={handleBackdropPress}
            accessibilityLabel="Dismiss keyboard"
          />

          <View
            className="w-full rounded-t-3xl bg-white shadow-2xl overflow-hidden"
            style={{
              maxHeight: availableHeight,
              flexShrink: 1,
            }}
          >
            {/* Header */}
            <Pressable
              onPress={() => {
                if (keyboardVisible || isInputFocusedRef.current) {
                  Keyboard.dismiss();
                }
              }}
              className="flex-row items-center justify-between border-b px-5"
              style={{
                borderColor: Colors.borderSoft || "#E2E8F0",
                paddingVertical: keyboardVisible ? 10 : 16,
                flexShrink: 0,
              }}
            >
            <View className="flex-row items-center gap-2.5 flex-1 pr-2">
              <View
                className="h-9 w-9 items-center justify-center rounded-full"
                style={{ backgroundColor: Colors.ui?.successSoft || "#E9F8EF" }}
              >
                <Ionicons
                  name="star"
                  size={18}
                  color={Colors.text?.statusComplete || "#2C8A5A"}
                />
              </View>
              <View className="flex-1">
                <Text
                  className="text-base font-extrabold"
                  style={{ color: Colors.text?.heading || "#0F172A" }}
                >
                  {submittedResult
                    ? "Feedback Confirmed"
                    : existingFeedback
                      ? "Your Submitted Feedback"
                      : "Rate Government Solution"}
                </Text>
                <Text
                  className="text-xs"
                  style={{ color: Colors.text?.secondary || "#6B7280" }}
                  numberOfLines={1}
                >
                  {report.issueType} • {report.location}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleCloseModal}
              disabled={isSubmitting}
              className="rounded-full p-1.5"
              style={{ backgroundColor: Colors.ui?.neutralSoft || "#E2E8F0" }}
            >
              <Ionicons
                name="close"
                size={18}
                color={Colors.text?.secondary || "#6B7280"}
              />
            </Pressable>
          </Pressable>

          <ScrollView
            ref={scrollViewRef}
            className="px-5"
            style={{ flexGrow: 0, flexShrink: 1 }}
            contentContainerStyle={{
              paddingTop: 16,
              paddingBottom: keyboardVisible ? 20 : 16,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
            onLayout={() => {
              if (isInputFocusedRef.current && keyboardVisible) {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }
            }}
          >
            {/* Confirmation Banner after fresh submission */}
            {submittedResult && (
              <View
                className="mb-4 rounded-2xl border p-4 items-center"
                style={{
                  backgroundColor: Colors.ui?.successSoft || "#E9F8EF",
                  borderColor: "#86EFAC",
                }}
              >
                <View
                  className="mb-2 h-11 w-11 items-center justify-center rounded-full"
                  style={{ backgroundColor: "#DCFCE7" }}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={26}
                    color={Colors.text?.statusComplete || "#15803D"}
                  />
                </View>
                <Text
                  className="text-base font-extrabold text-center"
                  style={{ color: Colors.text?.heading || "#0F172A" }}
                >
                  Thank You for Your Feedback!
                </Text>
                <Text
                  className="mt-1 text-xs text-center leading-5"
                  style={{ color: Colors.text?.body || "#334155" }}
                >
                  Your evaluation has been recorded and shared with the handling
                  government office to help improve community service.
                </Text>
              </View>
            )}

            {/* Existing Feedback Status Banner */}
            {!submittedResult && existingFeedback && (
              <View
                className="mb-4 flex-row items-center gap-2.5 rounded-xl border px-3.5 py-3"
                style={{
                  backgroundColor: Colors.ui?.infoSurface || "#EFF6FF",
                  borderColor: Colors.ui?.infoSurfaceBorder || "#DBEAFE",
                }}
              >
                <Ionicons
                  name="checkmark-done-circle"
                  size={20}
                  color={Colors.primaryStrong}
                />
                <View className="flex-1">
                  <Text
                    className="text-xs font-bold"
                    style={{ color: Colors.text?.infoHeading || "#1E3A8A" }}
                  >
                    Feedback Already Submitted
                  </Text>
                  {existingFeedback.createdAt && (
                    <Text
                      className="text-[11px] mt-0.5"
                      style={{ color: Colors.text?.secondary || "#6B7280" }}
                    >
                      Submitted on {formatDateTime(existingFeedback.createdAt)}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Report Summary Card */}
            <Pressable
              onPress={() => {
                if (keyboardVisible || isInputFocusedRef.current) {
                  Keyboard.dismiss();
                }
              }}
              className="mb-4 rounded-xl border px-3.5 py-3"
              style={{
                backgroundColor: Colors.ui?.slateSoft || "#F8FAFC",
                borderColor: Colors.borderSoft || "#E2E8F0",
              }}
            >
              <View className="flex-row items-center justify-between mb-1">
                <Text
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: Colors.text?.secondary || "#6B7280" }}
                >
                  Resolved Concern
                </Text>
                <View
                  className="rounded-full px-2 py-0.5"
                  style={{
                    backgroundColor: Colors.ui?.successSoft || "#E9F8EF",
                  }}
                >
                  <Text
                    className="text-[10px] font-bold"
                    style={{ color: Colors.text?.statusComplete || "#2C8A5A" }}
                  >
                    Resolved
                  </Text>
                </View>
              </View>
              <Text
                className="text-sm font-bold"
                style={{ color: Colors.text?.issueType || "#203A5F" }}
              >
                {report.issueType}
              </Text>
              <Text
                className="mt-1 text-xs leading-4"
                style={{ color: Colors.text?.bodySoft || "#475569" }}
                numberOfLines={2}
              >
                {report.description}
              </Text>
            </Pressable>

            {/* 1. Star Rating Section */}
            <View className="mb-5">
              <Text
                className="text-xs font-bold uppercase tracking-wide mb-1"
                style={{ color: Colors.text?.fieldLabel || "#374151" }}
              >
                1. Rate the Government&apos;s Response {!isReadOnly && "*"}
              </Text>
              <Text
                className="text-xs mb-3"
                style={{ color: Colors.text?.secondary || "#6B7280" }}
              >
                How would you rate how the assigned office handled and resolved
                your report?
              </Text>

              <View className="flex-row items-center justify-center gap-3 py-2">
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const activeRating = isReadOnly
                    ? displayFeedback.rating
                    : rating;
                  const isFilled = starValue <= activeRating;

                  return (
                    <Pressable
                      key={starValue}
                      disabled={isReadOnly || isSubmitting}
                      onPress={() => {
                        setRating(starValue);
                        if (errorMessage) setErrorMessage("");
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Rate ${starValue} out of 5 stars`}
                      className="items-center p-1.5"
                    >
                      <Ionicons
                        name={isFilled ? "star" : "star-outline"}
                        size={36}
                        color={isFilled ? "#F59E0B" : "#CBD5E1"}
                      />
                      <Text
                        className="mt-1 text-[10px] font-bold"
                        style={{
                          color: isFilled
                            ? "#B45309"
                            : Colors.text?.secondary || "#94A3B8",
                        }}
                      >
                        {starValue}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {(isReadOnly ? displayFeedback.rating : rating) > 0 && (
                <View className="mt-1 items-center">
                  <View
                    className="rounded-full px-3 py-1"
                    style={{ backgroundColor: "#FEF3C7" }}
                  >
                    <Text
                      className="text-xs font-extrabold"
                      style={{ color: "#B45309" }}
                    >
                      {isReadOnly ? displayFeedback.rating : rating} / 5 Stars —{" "}
                      {
                        RATING_LABELS[
                          isReadOnly ? displayFeedback.rating : rating
                        ]
                      }
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* 2. Written Feedback Text Field */}
            <View
              className="mb-4"
              onLayout={(e) => {
                feedbackSectionYRef.current = e.nativeEvent.layout.y;
              }}
            >
              <View className="flex-row items-center justify-between mb-1">
                <Text
                  className="text-xs font-bold uppercase tracking-wide"
                  style={{ color: Colors.text?.fieldLabel || "#374151" }}
                >
                  2. Written Feedback & Experience
                </Text>
                {!isReadOnly && (
                  <Text
                    className="text-[11px]"
                    style={{ color: Colors.text?.secondary || "#6B7280" }}
                  >
                    {comment.length}/2000
                  </Text>
                )}
              </View>

              {isReadOnly ? (
                <View
                  className="rounded-xl border p-3.5"
                  style={{
                    backgroundColor: Colors.ui?.slateSoft || "#F8FAFC",
                    borderColor: Colors.borderSoft || "#E2E8F0",
                  }}
                >
                  <Text
                    className="text-sm leading-5"
                    style={{ color: Colors.text?.bodyStrong || "#1F2937" }}
                  >
                    {displayFeedback.comment
                      ? displayFeedback.comment
                      : "No additional written comments provided."}
                  </Text>
                </View>
              ) : (
                <>
                  <Text
                    className="text-xs mb-2"
                    style={{ color: Colors.text?.secondary || "#6B7280" }}
                  >
                    Share details about how the solution was carried out or how
                    the service can be improved.
                  </Text>
                  <TextInput
                    ref={inputRef}
                    value={comment}
                    onChangeText={setComment}
                    onFocus={() => {
                      isInputFocusedRef.current = true;
                      scrollToFeedbackInput(true);
                    }}
                    onBlur={() => {
                      isInputFocusedRef.current = false;
                    }}
                    onContentSizeChange={handleCommentSizeChange}
                    editable={!isSubmitting}
                    multiline
                    scrollEnabled={false}
                    maxLength={2000}
                    numberOfLines={4}
                    textAlignVertical="top"
                    placeholder="Write your experience with the government's solution..."
                    placeholderTextColor="#9CA3AF"
                    className="min-h-[100px] rounded-xl border p-3.5 text-sm"
                    style={{
                      borderColor: Colors.border || "#E5E7EB",
                      backgroundColor: "#FFFFFF",
                      color: Colors.text?.primary || "#111827",
                    }}
                  />
                </>
              )}
            </View>

            {/* Error Alert */}
            {Boolean(errorMessage) && (
              <View
                className="mb-4 flex-row items-center gap-2 rounded-xl border px-3.5 py-2.5"
                style={{
                  backgroundColor: Colors.ui?.dangerSoft || "#FEF2F2",
                  borderColor: Colors.borderDanger || "#FECACA",
                }}
              >
                <Ionicons
                  name="alert-circle"
                  size={16}
                  color={Colors.error || "#EF4444"}
                />
                <Text
                  className="flex-1 text-xs font-semibold"
                  style={{ color: Colors.text?.danger || "#B91C1C" }}
                >
                  {errorMessage}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer Action Buttons */}
          <View
            className="border-t px-5 flex-row gap-3"
            style={{
              borderColor: Colors.borderSoft || "#E2E8F0",
              paddingTop: keyboardVisible ? 10 : 14,
              paddingBottom: keyboardVisible
                ? 10
                : Math.max(insets.bottom, 16),
              flexShrink: 0,
            }}
          >
            {isReadOnly ? (
              <Pressable
                onPress={handleCloseModal}
                className="flex-1 items-center justify-center rounded-xl py-3.5"
                style={{ backgroundColor: Colors.primaryStrong }}
              >
                <Text className="text-sm font-bold text-white">Done</Text>
              </Pressable>
            ) : (
              <>
                <Pressable
                  onPress={handleCloseModal}
                  disabled={isSubmitting}
                  className="rounded-xl border px-5 py-3.5 items-center justify-center"
                  style={{
                    borderColor: Colors.borderMuted || "#CBD5E1",
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  <Text
                    className="text-sm font-bold"
                    style={{ color: Colors.text?.body || "#334155" }}
                  >
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleSubmit}
                  disabled={isSubmitting || rating < 1}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3.5"
                  style={{
                    backgroundColor:
                      rating >= 1 && !isSubmitting
                        ? Colors.primaryStrong
                        : "#94A3B8",
                  }}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons
                      name="paper-plane-outline"
                      size={16}
                      color="#FFFFFF"
                    />
                  )}
                  <Text className="text-sm font-bold text-white">
                    {isSubmitting ? "Submitting..." : "Submit Feedback"}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

