export function toReportResponse(reportRow) {
  return {
    id: reportRow.id,
    issueType: reportRow.issue_type,
    description: reportRow.description,
    location: reportRow.location,
    status: reportRow.status,
    sentimentLabel: reportRow.sentiment_label,
    attachmentUrl: reportRow.attachment_url,
    createdAt: reportRow.created_at,
    updatedAt: reportRow.updated_at,
    userId: reportRow.user_id,
  };
}
