export function toReportFeedbackResponse(feedback) {
  if (!feedback) {
    return null;
  }

  const rating = Number(feedback.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return null;
  }

  return {
    id: feedback.id || null,
    reportId: feedback.reportId || feedback.report_id || null,
    userId: feedback.userId || feedback.user_id || null,
    rating: Math.round(rating),
    isSatisfied:
      typeof feedback.isSatisfied === "boolean"
        ? feedback.isSatisfied
        : typeof feedback.is_satisfied === "boolean"
          ? feedback.is_satisfied
          : null,
    comment: String(feedback.comment ?? "").trim(),
    createdAt: feedback.createdAt || feedback.created_at || null,
    updatedAt:
      feedback.updatedAt ||
      feedback.updated_at ||
      feedback.createdAt ||
      feedback.created_at ||
      null,
  };
}

export function toReportResponse(reportRow) {
  return {
    id: reportRow.id,
    reportNumber: reportRow.report_number || reportRow.id,
    issueType: reportRow.issue_type,
    description: reportRow.description,
    location: reportRow.location,
    latitude: reportRow.latitude != null ? Number(reportRow.latitude) : null,
    longitude: reportRow.longitude != null ? Number(reportRow.longitude) : null,
    status: reportRow.status,
    sentimentLabel: reportRow.sentiment_label,
    emotionLevel: reportRow.emotion_level ?? null,
    aiSummary: reportRow.ai_summary ?? null,
    attachmentUrl: reportRow.attachment_url,
    resolvedAt: reportRow.resolved_at ?? null,
    createdAt: reportRow.created_at,
    updatedAt: reportRow.updated_at,
    userId: reportRow.user_id,
    hasUnreadAdminMessage: Boolean(
      reportRow.has_unread_admin_message ??
      reportRow.hasUnreadAdminMessage ??
      false
    ),
    feedback: toReportFeedbackResponse(reportRow.feedback),
  };
}

