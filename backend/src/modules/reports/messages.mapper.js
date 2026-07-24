export function toReportMessageResponse(row) {
  return {
    id: row.id,
    reportId: row.report_id,
    senderId: row.sender_id,
    message: row.message,
    isRead: Boolean(row.is_read),
    readAt: row.read_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
