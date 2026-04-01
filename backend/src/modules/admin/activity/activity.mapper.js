export function toAdminActivityLogResponse(row) {
  return {
    id: row?.id || "",
    adminId: row?.admin_user_id || "",
    action: row?.action || "",
    detail: row?.detail || "",
    createdAt: row?.created_at || null,
  };
}
