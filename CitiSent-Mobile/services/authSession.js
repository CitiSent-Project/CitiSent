import { setCache, getCache, removeCache, clearAllCache } from "./cache";

let sessionToken = "";
let sessionUser = null;
let isInitialized = false;

const reservedRoleLabels = new Set([
  "citizen",
  "admin",
  "agency_staff",
  "agency staff",
  "authenticated",
]);

function normalizeToken(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhoneNumber(value) {
  return normalizeText(value).replace(/\D/g, "");
}

function pickFirstText(values) {
  for (const value of values) {
    const normalizedValue = normalizeText(value);
    if (normalizedValue) {
      return normalizedValue;
    }
  }

  return "";
}

function isRoleLabel(value) {
  return reservedRoleLabels.has(normalizeText(value).toLowerCase());
}

function resolveUsername(user, fallbackUsername) {
  const usernameCandidate = pickFirstText([
    user?.username,
    user?.profile?.username,
    user?.user_metadata?.username,
    user?.userMetadata?.username,
    user?.metadata?.username,
  ]);

  if (usernameCandidate && !isRoleLabel(usernameCandidate)) {
    return usernameCandidate;
  }

  const fallbackCandidate = pickFirstText([fallbackUsername]);
  if (fallbackCandidate && !isRoleLabel(fallbackCandidate)) {
    return fallbackCandidate;
  }

  return "";
}

function resolvePhoneNumber(user, fallbackPhoneNumber) {
  return normalizePhoneNumber(
    pickFirstText([
      user?.phoneNumber,
      user?.phone_number,
      user?.phone,
      user?.mobileNumber,
      user?.profile?.phoneNumber,
      user?.profile?.phone_number,
      user?.user_metadata?.phoneNumber,
      user?.user_metadata?.phone_number,
      user?.userMetadata?.phoneNumber,
      user?.metadata?.phoneNumber,
      fallbackPhoneNumber,
    ]),
  );
}

function normalizeUser(user, options = {}) {
  if (!user || typeof user !== "object") {
    return null;
  }

  const username = resolveUsername(user, options.fallbackUsername);
  const phoneNumber = resolvePhoneNumber(user, options.fallbackPhoneNumber);
  const gender =
    user.gender || user.profile?.gender || user.user_metadata?.gender || "";
  const profileImage =
    user.profileImage ||
    user.profile?.profileImage ||
    user.user_metadata?.profileImage ||
    null;

  return {
    ...user,
    username,
    phoneNumber,
    gender,
    profileImage,
  };
}

export async function initAuthSession() {
  if (isInitialized) return { token: sessionToken, user: sessionUser };
  try {
    const token = await getCache("auth_token", { ignoreExpiry: true });
    const user = await getCache("auth_user", { ignoreExpiry: true });
    if (token) sessionToken = token;
    if (user) sessionUser = user;
  } catch (err) {
    console.warn("Failed to initialize auth session from storage:", err);
  } finally {
    isInitialized = true;
  }
  return { token: sessionToken, user: sessionUser };
}

export function setAuthToken(token) {
  sessionToken = normalizeToken(token);
  if (sessionToken) {
    setCache("auth_token", sessionToken);
  } else {
    removeCache("auth_token");
  }
}

export function getAuthToken() {
  return sessionToken;
}

export function setAuthUser(user, options = {}) {
  sessionUser = normalizeUser(user, options);
  if (sessionUser) {
    setCache("auth_user", sessionUser);
  } else {
    removeCache("auth_user");
  }
}

export function getAuthUser() {
  return sessionUser;
}

export function getAuthGender() {
  return sessionUser?.gender || "";
}

export function getAuthProfileImage() {
  return sessionUser?.profileImage || null;
}

export function getAuthUsername(fallbackValue = "") {
  const username = normalizeText(sessionUser?.username);
  return username || normalizeText(fallbackValue);
}

export function getAuthPhoneNumber(fallbackValue = "") {
  const phoneNumber = normalizePhoneNumber(sessionUser?.phoneNumber);
  return phoneNumber || normalizePhoneNumber(fallbackValue);
}

export function clearAuthToken() {
  sessionToken = "";
  sessionUser = null;
  clearAllCache();
}
