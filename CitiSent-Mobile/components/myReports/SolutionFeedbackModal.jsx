import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, formatDateTime } from "../../modules/shared";

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
  const existingFeedback = report?.feedback || null;
  const [rating, setRating] = useState(0);
  const [isSatisfied, setIsSatisfied] = useState(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submittedResult, setSubmittedResult] = useState(null);

  useEffect(() => {
    if (visible) {
      setRating(existingFeedback?.rating || 0);
      setIsSatisfied(
        typeof existingFeedback?.isSatisfied === "boolean"
          ? existingFeedback.isSatisfied
          : null,
      );
      setComment(existingFeedback?.comment || "");
      setErrorMessage("");
      setIsSubmitting(false);
      setSubmittedResult(null);
    }
  }, [visible, report?.id, existingFeedback]);

  if (!report) return null;

  const isCompletedReport =
    String(report.status || "").trim().toLowerCase() === "completed" ||
    String(report.rawStatus || "").trim().toLowerCase() === "resolved";

  const displayFeedback = submittedResult || existingFeedback;
  const isReadOnly = Boolean(displayFeedback);

  const handleToggleSatisfied = (value) => {
    if (isReadOnly || isSubmitting) return;
    setIsSatisfied((prev) => (prev === value ? null : value));
  };

  const handleSubmit = async () => {
    if (isReadOnly || isSubmitting) return;

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
        isSatisfied,
        comment: comment.trim(),
      });

      const savedFeedback = result?.feedback || {
        rating,
        isSatisfied,
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
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="max-h-[90%] w-full rounded-t-3xl bg-white shadow-2xl overflow-hidden">
          {/* Header */}
          <View
            className="flex-row items-center justify-between border-b px-5 py-4"
            style={{ borderColor: Colors.borderSoft || "#E2E8F0" }}
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
              onPress={onClose}
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
          </View>

          <ScrollView
            className="px-5 py-4"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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
            <View
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
            </View>

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

            {/* 2. Optional Satisfaction Question */}
            <View className="mb-5">
              <Text
                className="text-xs font-bold uppercase tracking-wide mb-1"
                style={{ color: Colors.text?.fieldLabel || "#374151" }}
              >
                2. Overall Solution Satisfaction (Optional)
              </Text>
              <Text
                className="text-xs mb-3"
                style={{ color: Colors.text?.secondary || "#6B7280" }}
              >
                Are you satisfied with the solution provided by the government
                employee?
              </Text>

              <View className="flex-row gap-3">
                <Pressable
                  disabled={isReadOnly || isSubmitting}
                  onPress={() => handleToggleSatisfied(true)}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border py-3 px-3"
                  style={{
                    borderColor:
                      (isReadOnly
                        ? displayFeedback.isSatisfied
                        : isSatisfied) === true
                        ? "#16A34A"
                        : Colors.border || "#E5E7EB",
                    backgroundColor:
                      (isReadOnly
                        ? displayFeedback.isSatisfied
                        : isSatisfied) === true
                        ? "#DCFCE7"
                        : "#FFFFFF",
                  }}
                >
                  <Ionicons
                    name={
                      (isReadOnly
                        ? displayFeedback.isSatisfied
                        : isSatisfied) === true
                        ? "thumbs-up"
                        : "thumbs-up-outline"
                    }
                    size={16}
                    color={
                      (isReadOnly
                        ? displayFeedback.isSatisfied
                        : isSatisfied) === true
                        ? "#15803D"
                        : Colors.text?.secondary || "#6B7280"
                    }
                  />
                  <Text
                    className="text-xs font-bold"
                    style={{
                      color:
                        (isReadOnly
                          ? displayFeedback.isSatisfied
                          : isSatisfied) === true
                          ? "#15803D"
                          : Colors.text?.body || "#334155",
                    }}
                  >
                    Yes, Satisfied
                  </Text>
                </Pressable>

                <Pressable
                  disabled={isReadOnly || isSubmitting}
                  onPress={() => handleToggleSatisfied(false)}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border py-3 px-3"
                  style={{
                    borderColor:
                      (isReadOnly
                        ? displayFeedback.isSatisfied
                        : isSatisfied) === false
                        ? "#DC2626"
                        : Colors.border || "#E5E7EB",
                    backgroundColor:
                      (isReadOnly
                        ? displayFeedback.isSatisfied
                        : isSatisfied) === false
                        ? "#FEE2E2"
                        : "#FFFFFF",
                  }}
                >
                  <Ionicons
                    name={
                      (isReadOnly
                        ? displayFeedback.isSatisfied
                        : isSatisfied) === false
                        ? "thumbs-down"
                        : "thumbs-down-outline"
                    }
                    size={16}
                    color={
                      (isReadOnly
                        ? displayFeedback.isSatisfied
                        : isSatisfied) === false
                        ? "#B91C1C"
                        : Colors.text?.secondary || "#6B7280"
                    }
                  />
                  <Text
                    className="text-xs font-bold"
                    style={{
                      color:
                        (isReadOnly
                          ? displayFeedback.isSatisfied
                          : isSatisfied) === false
                          ? "#B91C1C"
                          : Colors.text?.body || "#334155",
                    }}
                  >
                    No, Unsatisfied
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* 3. Written Feedback Text Field */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-1">
                <Text
                  className="text-xs font-bold uppercase tracking-wide"
                  style={{ color: Colors.text?.fieldLabel || "#374151" }}
                >
                  3. Written Feedback & Experience
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
                    value={comment}
                    onChangeText={setComment}
                    editable={!isSubmitting}
                    multiline
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
            className="border-t px-5 py-4 flex-row gap-3"
            style={{ borderColor: Colors.borderSoft || "#E2E8F0" }}
          >
            {isReadOnly ? (
              <Pressable
                onPress={onClose}
                className="flex-1 items-center justify-center rounded-xl py-3.5"
                style={{ backgroundColor: Colors.primaryStrong }}
              >
                <Text className="text-sm font-bold text-white">Done</Text>
              </Pressable>
            ) : (
              <>
                <Pressable
                  onPress={onClose}
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
    </Modal>
  );
}

