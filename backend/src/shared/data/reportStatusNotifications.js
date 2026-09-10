const STATUS_NOTIFICATION_CONTENT = Object.freeze({
  pending: Object.freeze({
    statusCode: "pending",
    statusLabel: "Received",
    eventType: "report_received",
    title: "Report Received",
    message: "Your report has been received and queued for review.",
  }),
  in_review: Object.freeze({
    statusCode: "in_review",
    statusLabel: "Being Processed",
    eventType: "report_in_review",
    title: "Report Is Being Processed",
    message: "Your report is now being processed by the assigned office.",
  }),
  resolved: Object.freeze({
    statusCode: "resolved",
    statusLabel: "Resolved",
    eventType: "report_resolved",
    title: "Report Resolved",
    message: "Your report has been resolved. Open the app to review details.",
  }),
  rejected: Object.freeze({
    statusCode: "rejected",
    statusLabel: "Rejected",
    eventType: "report_rejected",
    title: "Report Rejected",
    message: "Your report has been marked as rejected. Open the app to review details.",
  }),
});

function normalizeStatus(status) {
  const normalizedStatus = String(status || "")
    .trim()
    .toLowerCase();

  return STATUS_NOTIFICATION_CONTENT[normalizedStatus] ? normalizedStatus : "";
}

export function getStatusNotificationContent(status) {
  const normalizedStatus = normalizeStatus(status);
  return normalizedStatus ? STATUS_NOTIFICATION_CONTENT[normalizedStatus] : null;
}

export function inferStatusNotificationMeta({ type, title, reportId }) {
  const normalizedType = String(type || "")
    .trim()
    .toLowerCase();

  if (normalizedType !== "status") {
    return null;
  }

  const normalizedTitle = String(title || "").trim();

  const match = Object.values(STATUS_NOTIFICATION_CONTENT).find(
    (entry) => entry.title === normalizedTitle,
  );

  if (!match) {
    return null;
  }

  return {
    statusCode: match.statusCode,
    statusLabel: match.statusLabel,
    eventType: match.eventType,
    deeplink: reportId
      ? `citisent://profile/notifications?reportId=${reportId}`
      : "citisent://profile/notifications",
  };
}
