const NOTIFICATION_TYPE_LABELS = Object.freeze({
  status: "Status",
  report: "Report",
  account: "Account",
  alert: "Alert",
  system: "System",
});

export function toAdminNotificationResponse(row) {
  const normalizedType = String(row?.type || "system")
    .trim()
    .toLowerCase();

  return {
    id: row?.id || "",
    title: row?.title || "",
    message: row?.message || "",
    type: NOTIFICATION_TYPE_LABELS[normalizedType] || "System",
    read: Boolean(row?.is_read),
    reportId: row?.report_id || null,
    readAt: row?.read_at || null,
    createdAt: row?.created_at || null,
    metadata: row?.metadata || null,
  };
}
