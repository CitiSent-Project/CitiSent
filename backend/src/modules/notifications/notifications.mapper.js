import { inferStatusNotificationMeta } from "../../shared/data/reportStatusNotifications.js";

export function toNotificationResponse(row) {
  const normalizedType = String(row?.type || "system")
    .trim()
    .toLowerCase();

  let meta = inferStatusNotificationMeta({
    type: normalizedType,
    title: row?.title,
    reportId: row?.report_id,
  });

  if (row?.metadata && typeof row.metadata === "object") {
    meta = { ...meta, ...row.metadata };
  }

  return {
    id: row?.id || "",
    userId: row?.user_id || null,
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
