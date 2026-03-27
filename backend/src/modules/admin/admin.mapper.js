import {
  USER_ROLES,
  normalizeUserRole,
} from "../../shared/auth/roleAccess.js";
import {
  resolveDepartmentId,
  resolveDepartmentLabel,
} from "../../shared/data/departments.js";

const STATUS_LABELS = Object.freeze({
  pending: "Pending",
  in_review: "In Progress",
  resolved: "Resolved",
  rejected: "Unresolved",
});

function normalizeStatusValue(status) {
  const normalizedStatus = String(status || "")
    .trim()
    .toLowerCase();

  return STATUS_LABELS[normalizedStatus] ? normalizedStatus : "pending";
}

function resolveUrgency(value) {
  const normalizedValue = String(value || "")
    .trim()
    .toLowerCase();

  if (
    normalizedValue.includes("emergency") ||
    normalizedValue.includes("critical")
  ) {
    return "Emergency";
  }

  if (
    normalizedValue.includes("urgent") ||
    normalizedValue.includes("high") ||
    normalizedValue.includes("negative")
  ) {
    return "Urgent";
  }

  if (
    normalizedValue.includes("moderate") ||
    normalizedValue.includes("medium") ||
    normalizedValue.includes("neutral")
  ) {
    return "Moderate";
  }

  return "Calm";
}

function resolveReporterName(profile) {
  return (
    profile?.full_name ||
    profile?.username ||
    profile?.email ||
    "Unknown Reporter"
  );
}

function resolveManagedUserStatus(activeBan) {
  return activeBan ? "banned" : "active";
}

export function toAdminUserResponse({ profile, activeBan }) {
  const role = normalizeUserRole(profile?.role);
  const status = resolveManagedUserStatus(activeBan);

  return {
    id: profile?.user_id || "",
    email: profile?.email || null,
    username: profile?.username || null,
    fullName: profile?.full_name || profile?.username || profile?.email || "",
    phoneNumber: profile?.phone_number || null,
    address: profile?.address || null,
    role: role || null,
    accountType: profile?.account_type || "citizen",
    departmentId:
      profile?.department_id || resolveDepartmentId(profile?.department_label),
    departmentLabel:
      profile?.department_label || resolveDepartmentLabel(profile?.department_id),
    status,
    joinedAt: profile?.created_at || null,
    updatedAt: profile?.updated_at || null,
    ban: activeBan
      ? {
          reason: activeBan.reason || null,
          bannedAt: activeBan.banned_at || null,
          bannedByUserId: activeBan.banned_by_user_id || null,
        }
      : null,
  };
}

export function toAdminReportResponse({ reportRow, reporterProfile }) {
  const normalizedStatus = normalizeStatusValue(reportRow?.status);

  return {
    id: reportRow?.id,
    issueType: reportRow?.issue_type || "",
    description: reportRow?.description || "",
    location: reportRow?.location || "",
    departmentId: resolveDepartmentId(reportRow?.issue_type),
    departmentLabel: resolveDepartmentLabel(reportRow?.issue_type),
    status: normalizedStatus,
    statusLabel: STATUS_LABELS[normalizedStatus],
    urgency: resolveUrgency(reportRow?.urgency || reportRow?.sentiment_label),
    sentimentLabel: reportRow?.sentiment_label || null,
    attachmentUrl: reportRow?.attachment_url || null,
    source: reportRow?.source || "Website",
    createdAt: reportRow?.created_at || null,
    updatedAt: reportRow?.updated_at || null,
    reporter: {
      id: reportRow?.user_id || null,
      email: reporterProfile?.email || null,
      fullName: resolveReporterName(reporterProfile),
    },
  };
}

export function toOfficeAdminResponse(profile) {
  const role = normalizeUserRole(profile?.role);

  return {
    id: profile?.user_id || "",
    email: profile?.email || null,
    fullName: profile?.full_name || profile?.username || "",
    role: role || USER_ROLES.OFFICE_ADMIN,
    departmentId:
      profile?.department_id || resolveDepartmentId(profile?.department_label),
    departmentLabel:
      profile?.department_label || resolveDepartmentLabel(profile?.department_id),
    phoneNumber: profile?.phone_number || null,
    address: profile?.address || null,
    joinedAt: profile?.created_at || null,
  };
}

export function toTransferRequestResponse(row) {
  return {
    id: row?.id,
    adminId: row?.admin_user_id,
    adminName: row?.admin_name,
    currentDepartmentId: row?.current_department_id,
    currentDepartmentLabel: row?.current_department_label,
    requestedDepartmentId: row?.requested_department_id,
    requestedDepartmentLabel: row?.requested_department_label,
    reason: row?.reason || "",
    status: row?.status || "pending",
    createdAt: row?.created_at || null,
    reviewedAt: row?.reviewed_at || null,
    reviewerId: row?.reviewed_by_user_id || null,
    reviewerName: row?.reviewed_by_name || null,
    reviewNotes: row?.review_notes || "",
  };
}

export function mapReportStatusInputToPersisted(status) {
  const normalizedStatus = String(status || "")
    .trim()
    .toLowerCase();

  if (STATUS_LABELS[normalizedStatus]) {
    return normalizedStatus;
  }

  if (normalizedStatus === "in progress") {
    return "in_review";
  }

  if (normalizedStatus === "unresolved") {
    return "rejected";
  }

  if (normalizedStatus === "resolved") {
    return "resolved";
  }

  return "pending";
}
