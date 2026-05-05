import {
  buildDepartmentCandidates,
  resolveDepartmentId,
  resolveDepartmentLabel,
} from "../data/departments.js";
import { composeFullName } from "../utils/name.js";

export const USER_ROLES = Object.freeze({
  SUPERADMIN: "Superadmin",
  OFFICE_ADMIN: "Office Admin",
});

export const ACCOUNT_TYPES = Object.freeze({
  ADMIN: "admin",
  CITIZEN: "citizen",
});

function normalizeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function normalizeUserRole(role) {
  if (role === USER_ROLES.SUPERADMIN || role === USER_ROLES.OFFICE_ADMIN) {
    return role;
  }

  const normalizedRole = normalizeValue(role);
  if (
    normalizedRole === "administrator" ||
    normalizedRole === "admin" ||
    normalizedRole === "super admin" ||
    normalizedRole === "superadmin"
  ) {
    return USER_ROLES.SUPERADMIN;
  }

  if (
    normalizedRole === "officeadmin" ||
    normalizedRole === "office admin" ||
    normalizedRole === "office-admin"
  ) {
    return USER_ROLES.OFFICE_ADMIN;
  }

  return "";
}

export function normalizeAccountType(accountType, role) {
  if (normalizeValue(accountType) === ACCOUNT_TYPES.ADMIN) {
    return ACCOUNT_TYPES.ADMIN;
  }

  if (normalizeValue(accountType) === ACCOUNT_TYPES.CITIZEN) {
    return ACCOUNT_TYPES.CITIZEN;
  }

  return normalizeUserRole(role) ? ACCOUNT_TYPES.ADMIN : ACCOUNT_TYPES.CITIZEN;
}

export function isAdminRole(role) {
  return Boolean(normalizeUserRole(role));
}

export function isSuperadmin(role) {
  return normalizeUserRole(role) === USER_ROLES.SUPERADMIN;
}

export function canReviewTransferRequest(role) {
  return isSuperadmin(role);
}

export function canSubmitTransferRequest(role) {
  return normalizeUserRole(role) === USER_ROLES.OFFICE_ADMIN;
}

export function canAccessDepartment({
  role,
  actorDepartmentId,
  actorDepartmentLabel,
  resourceDepartmentValue,
}) {
  if (isSuperadmin(role)) {
    return true;
  }

  const actorCandidates = buildDepartmentCandidates({
    departmentId: actorDepartmentId,
    departmentLabel: actorDepartmentLabel,
  }).map(normalizeValue);

  const resourceCandidates = buildDepartmentCandidates({
    departmentId: resolveDepartmentId(resourceDepartmentValue),
    departmentLabel: resolveDepartmentLabel(resourceDepartmentValue),
  }).map(normalizeValue);

  return resourceCandidates.some((value) => actorCandidates.includes(value));
}

export function buildActor({ authUser, profile }) {
  const fname = profile?.fname ?? authUser?.user_metadata?.fname ?? null;
  const mname = profile?.mname ?? authUser?.user_metadata?.mname ?? null;
  const lname = profile?.lname ?? authUser?.user_metadata?.lname ?? null;
  const profileName = composeFullName({
    fname,
    mname,
    lname,
  });
  const metadataName = composeFullName({
    fname: authUser?.user_metadata?.fname,
    mname: authUser?.user_metadata?.mname,
    lname: authUser?.user_metadata?.lname,
  });
  const fullName =
    profileName ||
    metadataName ||
    profile?.full_name ||
    profile?.fullName ||
    authUser?.user_metadata?.full_name ||
    authUser?.user_metadata?.fullName ||
    profile?.username ||
    authUser?.user_metadata?.username ||
    "";
  const role = normalizeUserRole(profile?.role || authUser?.role);
  const accountType = normalizeAccountType(profile?.account_type, role);

  return {
    id: authUser?.id || profile?.user_id || "",
    email: authUser?.email || profile?.email || null,
    fullName,
    fname,
    mname,
    lname,
    username: profile?.username || authUser?.user_metadata?.username || null,
    phoneNumber:
      profile?.phone_number ||
      authUser?.phone ||
      authUser?.user_metadata?.phoneNumber ||
      null,
    address: profile?.address || null,
    age: profile?.age ?? null,
    gender: profile?.gender ?? null,
    clientType: profile?.client_type ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    role,
    accountType,
    departmentId:
      profile?.department_id ||
      resolveDepartmentId(profile?.department_label) ||
      "",
    departmentLabel:
      profile?.department_label ||
      resolveDepartmentLabel(profile?.department_id) ||
      "",
    joinedAt: profile?.created_at || authUser?.created_at || null,
    lastLoginAt: authUser?.last_sign_in_at || null,
    hasProfile: Boolean(profile),
  };
}
