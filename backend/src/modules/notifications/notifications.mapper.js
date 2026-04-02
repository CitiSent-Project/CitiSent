import { inferStatusNotificationMeta } from "../../shared/data/reportStatusNotifications.js";

export function toNotificationResponse(row) {
  const normalizedType = String(row?.type || "system")
    .trim()
    .toLowerCase();

  const meta = inferStatusNotificationMeta({
    type: normalizedType,
    title: row?.title,
    reportId: row?.report_id,
  });

  return {
    id: row?.id || "",
    type: normalizedType,
    title: row?.title || "",
    message: row?.message || "",
    reportId: row?.report_id || null,
    read: Boolean(row?.is_read),
    readAt: row?.read_at || null,
    createdAt: row?.created_at || null,
    meta,
  };
}
