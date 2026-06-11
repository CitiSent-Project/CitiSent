export function toReportResponse(reportRow) {
  return {
    id: reportRow.id,
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
    createdAt: reportRow.created_at,
    updatedAt: reportRow.updated_at,
    userId: reportRow.user_id,
  };
}
