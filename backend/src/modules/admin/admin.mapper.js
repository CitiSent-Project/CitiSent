import {
  USER_ROLES,
  normalizeUserRole,
} from "../../shared/auth/roleAccess.js";
import {
  resolveDepartmentId,
  resolveDepartmentLabel,
} from "../../shared/data/departments.js";
import { composeFullName } from "../../shared/utils/name.js";

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
    normalizedValue.includes("critical") ||
    normalizedValue.includes("emergency")
  ) {
    return "Critical";
  }

  if (
    normalizedValue.includes("high") ||
    normalizedValue.includes("urgent") ||
    normalizedValue.includes("negative")
  ) {
    return "High";
  }

  if (
    normalizedValue.includes("medium") ||
    normalizedValue.includes("moderate") ||
    normalizedValue.includes("neutral")
  ) {
    return "Medium";
  }

  return "Low";
}

function resolveReporterName(profile) {
  return (
    composeFullName({
      fname: profile?.fname,
      mname: profile?.mname,
      lname: profile?.lname,
    }) ||
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
    fname: profile?.fname ?? null,
    mname: profile?.mname ?? null,
    lname: profile?.lname ?? null,
    fullName:
      composeFullName({
        fname: profile?.fname,
        mname: profile?.mname,
        lname: profile?.lname,
      }) ||
      profile?.username ||
      profile?.email ||
      "",
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
  const resolvedDepartmentId =
    String(reportRow?.department_slug || "").trim() ||
    resolveDepartmentId(reportRow?.issue_type);
  const resolvedDepartmentLabel =
    String(reportRow?.department_name || "").trim() ||
    resolveDepartmentLabel(reportRow?.issue_type);

  return {
    id: reportRow?.id,
    issueType: reportRow?.issue_type || "",
    description: reportRow?.description || "",
    location: reportRow?.location || "",
    departmentId: resolvedDepartmentId,
    departmentLabel: resolvedDepartmentLabel,
    status: normalizedStatus,
    statusLabel: STATUS_LABELS[normalizedStatus],
    urgency: resolveUrgency(reportRow?.urgency || reportRow?.sentiment_label),
    sentimentLabel: reportRow?.sentiment_label || null,
    emotionLevel: reportRow?.emotion_level || null,
    aiSummary: reportRow?.ai_summary || null,
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
    fname: profile?.fname ?? null,
    mname: profile?.mname ?? null,
    lname: profile?.lname ?? null,
    fullName:
      composeFullName({
        fname: profile?.fname,
        mname: profile?.mname,
        lname: profile?.lname,
      }) ||
      profile?.username ||
      "",
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
