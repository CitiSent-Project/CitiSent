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
  rejected: "Rejected",
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
  if (
    profile?.account_type === "guest" ||
    profile?.role === "guest" ||
    profile?.is_guest
  ) {
    return "Guest";
  }

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

function resolveActivationStatus(profile) {
  const normalizedStatus = String(profile?.activation_status || "")
    .trim()
    .toLowerCase();

  return normalizedStatus === "pending" ? "pending" : "active";
}

export function toAdminUserResponse({ profile, activeBan }) {
  const role = normalizeUserRole(profile?.role);
  const activationStatus = resolveActivationStatus(profile);
  const status = activeBan ? resolveManagedUserStatus(activeBan) : activationStatus;

  return {
    id: profile?.user_id || "",
    displayId: profile?.display_id ? String(profile.display_id) : null,
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
    gender: profile?.gender || null,
    barangay: profile?.barangay || null,
    city: profile?.city || null,
    province: profile?.province || null,
    role: role || null,
    accountType: profile?.account_type || "citizen",
    departmentId:
      profile?.department_id || resolveDepartmentId(profile?.department_label),
    departmentLabel:
      profile?.department_label || resolveDepartmentLabel(profile?.department_id),
    status,
    activationStatus,
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

  const isGuest =
    reporterProfile?.account_type === "guest" ||
    reporterProfile?.role === "guest" ||
    Boolean(reporterProfile?.is_guest);

  return {
    id: reportRow?.id,
    reportNumber: reportRow?.report_number || reportRow?.id,
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
    resolvedAt:
      reportRow?.resolved_at ||
      (normalizedStatus === "resolved" || normalizedStatus === "rejected"
        ? reportRow?.updated_at || null
        : null),
    updatedAt: reportRow?.updated_at || null,
    reporter: {
      id: reportRow?.user_id || null,
      displayId: reporterProfile?.display_id ? String(reporterProfile.display_id) : null,
      email: isGuest ? null : (reporterProfile?.email || null),
      fullName: resolveReporterName(reporterProfile),
    },
  };
}

export function toOfficeAdminResponse(profile) {
  const role = normalizeUserRole(profile?.role);

  return {
    id: profile?.user_id || "",
    displayId: profile?.display_id ? String(profile.display_id) : null,
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
    barangay: profile?.barangay || null,
    city: profile?.city || null,
    province: profile?.province || null,
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

  if (normalizedStatus === "rejected") {
    return "rejected";
  }

  if (normalizedStatus === "resolved") {
    return "resolved";
  }

  return "pending";
}
