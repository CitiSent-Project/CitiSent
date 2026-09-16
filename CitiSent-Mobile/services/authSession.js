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

function resolveFirstName(user) {
  if (!user || typeof user !== "object") {
    return "";
  }

  if ("first_name" in user && user.first_name !== undefined) {
    return normalizeText(user.first_name);
  }
  if ("fname" in user && user.fname !== undefined) {
    return normalizeText(user.fname);
  }
  if ("firstName" in user && user.firstName !== undefined) {
    return normalizeText(user.firstName);
  }

  const profile = user.profile;
  if (profile && typeof profile === "object") {
    if ("first_name" in profile && profile.first_name !== undefined) {
      return normalizeText(profile.first_name);
    }
    if ("fname" in profile && profile.fname !== undefined) {
      return normalizeText(profile.fname);
    }
    if ("firstName" in profile && profile.firstName !== undefined) {
      return normalizeText(profile.firstName);
    }
  }

  return pickFirstText([
    user?.user_metadata?.first_name,
    user?.user_metadata?.fname,
    user?.user_metadata?.firstName,
    user?.userMetadata?.first_name,
    user?.userMetadata?.fname,
    user?.metadata?.first_name,
    user?.metadata?.fname,
  ]);
}

function resolveMiddleName(user) {
  if (!user || typeof user !== "object") {
    return "";
  }

  if ("middle_name" in user && user.middle_name !== undefined) {
    return normalizeText(user.middle_name);
  }
  if ("mname" in user && user.mname !== undefined) {
    return normalizeText(user.mname);
  }
  if ("middleName" in user && user.middleName !== undefined) {
    return normalizeText(user.middleName);
  }

  const profile = user.profile;
  if (profile && typeof profile === "object") {
    if ("middle_name" in profile && profile.middle_name !== undefined) {
      return normalizeText(profile.middle_name);
    }
    if ("mname" in profile && profile.mname !== undefined) {
      return normalizeText(profile.mname);
    }
    if ("middleName" in profile && profile.middleName !== undefined) {
      return normalizeText(profile.middleName);
    }
  }

  return pickFirstText([
    user?.user_metadata?.middle_name,
    user?.user_metadata?.mname,
    user?.user_metadata?.middleName,
    user?.userMetadata?.middle_name,
    user?.userMetadata?.mname,
    user?.metadata?.middle_name,
    user?.metadata?.mname,
  ]);
}

function resolveSurname(user) {
  if (!user || typeof user !== "object") {
    return "";
  }

  if ("surname" in user && user.surname !== undefined) {
    return normalizeText(user.surname);
  }
  if ("last_name" in user && user.last_name !== undefined) {
    return normalizeText(user.last_name);
  }
  if ("lname" in user && user.lname !== undefined) {
    return normalizeText(user.lname);
  }
  if ("lastName" in user && user.lastName !== undefined) {
    return normalizeText(user.lastName);
  }

  const profile = user.profile;
  if (profile && typeof profile === "object") {
    if ("surname" in profile && profile.surname !== undefined) {
      return normalizeText(profile.surname);
    }
    if ("last_name" in profile && profile.last_name !== undefined) {
      return normalizeText(profile.last_name);
    }
    if ("lname" in profile && profile.lname !== undefined) {
      return normalizeText(profile.lname);
    }
    if ("lastName" in profile && profile.lastName !== undefined) {
      return normalizeText(profile.lastName);
    }
  }

  return pickFirstText([
    user?.user_metadata?.surname,
    user?.user_metadata?.last_name,
    user?.user_metadata?.lname,
    user?.user_metadata?.lastName,
    user?.userMetadata?.surname,
    user?.userMetadata?.last_name,
    user?.userMetadata?.lname,
    user?.metadata?.surname,
    user?.metadata?.last_name,
    user?.metadata?.lname,
  ]);
}

export function composeFullName({ firstName, middleName, surname } = {}) {
  const parts = [firstName, middleName, surname]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean);

  return parts.join(" ");
}

function resolveFullName(user) {
  if (!user || typeof user !== "object") {
    return "";
  }

  const firstName = resolveFirstName(user);
  const middleName = resolveMiddleName(user);
  const surname = resolveSurname(user);

  const builtFullName = composeFullName({ firstName, middleName, surname });
  if (builtFullName) {
    return builtFullName;
  }

  const directFullName = pickFirstText([
    user?.fullName,
    user?.name,
    user?.profile?.fullName,
    user?.profile?.name,
    user?.user_metadata?.fullName,
    user?.user_metadata?.name,
  ]);

  if (directFullName && !isRoleLabel(directFullName)) {
    return directFullName;
  }

  return "";
}

function normalizeUser(user, options = {}) {
  if (!user || typeof user !== "object") {
    return null;
  }

  const username = resolveUsername(user, options.fallbackUsername);
  const phoneNumber = resolvePhoneNumber(user, options.fallbackPhoneNumber);
  const firstName = resolveFirstName(user);
  const middleName = resolveMiddleName(user);
  const surname = resolveSurname(user);
  const fullName = resolveFullName(user);
  const gender =
    user.gender || user.profile?.gender || user.user_metadata?.gender || "";
  const profileImage =
    user.profileImage ||
    user.profile?.profileImage ||
    user.user_metadata?.profileImage ||
    null;

  const isGuest = Boolean(user.isGuest || user.role === "guest");
  const isVerified = isGuest ? Boolean(user.isVerified) : true;
  const email = user.email || user.user_metadata?.email || "";

  return {
    ...user,
    username,
    phoneNumber,
    email,
    gender,
    profileImage,
    isGuest,
    isVerified,
    fname: firstName,
    first_name: firstName,
    mname: middleName,
    middle_name: middleName,
    lname: surname,
    surname: surname,
    last_name: surname,
    fullName,
  };
}

function decodeBase64(input) {
  if (typeof globalThis.atob === "function") {
    try {
      return globalThis.atob(input);
    } catch {}
  }
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let str = String(input || "").replace(/=+$/, "");
  let output = "";
  if (str.length % 4 === 1) return "";
  for (
    let bc = 0, bs = 0, buffer, idx = 0;
    (buffer = str.charAt(idx++));
    ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
      ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
      : 0
  ) {
    buffer = chars.indexOf(buffer);
  }
  return output;
}

export function isJwtExpired(token) {
  if (!token || typeof token !== "string") return true;
  const parts = token.trim().split(".");
  if (parts.length !== 3) return false;

  try {
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    const jsonStr = decodeBase64(base64);
    const payload = JSON.parse(jsonStr);
    if (payload && typeof payload.exp === "number") {
      // 10-second skew buffer
      return payload.exp * 1000 <= Date.now() + 10000;
    }
  } catch {
    return false;
  }
  return false;
}

const authListeners = new Set();

export function onAuthStateChanged(listener) {
  if (typeof listener !== "function") return () => {};
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}

function notifyAuthState(user) {
  authListeners.forEach((listener) => {
    try {
      listener(user);
    } catch (err) {
      console.warn("[authSession] Error in auth listener:", err);
    }
  });
}

export async function initAuthSession() {
  if (isInitialized) return { token: sessionToken, user: sessionUser };
  try {
    const token = await getCache("auth_token", { ignoreExpiry: true });
    const user = await getCache("auth_user", { ignoreExpiry: true });

    if (token && isJwtExpired(token)) {
      // Token is expired; clear stale cached session
      await removeCache("auth_token");
      await removeCache("auth_user");
      sessionToken = "";
      sessionUser = null;
    } else {
      if (token) sessionToken = token;
      if (user) sessionUser = user;
    }
  } catch (err) {
    console.warn("Failed to initialize auth session from storage:", err);
  } finally {
    isInitialized = true;
    notifyAuthState(sessionUser);
  }
  return { token: sessionToken, user: sessionUser };
}

export function setAuthToken(token, expiresInSeconds = 7 * 86400) {
  sessionToken = normalizeToken(token);
  if (sessionToken) {
    let calculatedTtl = expiresInSeconds;
    try {
      const parts = sessionToken.split(".");
      if (parts.length === 3) {
        let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) base64 += "=";
        const payload = JSON.parse(decodeBase64(base64));
        if (payload?.exp) {
          const diffSeconds = Math.floor((payload.exp * 1000 - Date.now()) / 1000);
          if (diffSeconds > 0) {
            calculatedTtl = diffSeconds;
          }
        }
      }
    } catch {}

    setCache("auth_token", sessionToken, calculatedTtl);
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
  notifyAuthState(sessionUser);
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

export function getAuthFirstName() {
  return normalizeText(
    sessionUser?.first_name ||
    sessionUser?.fname ||
    sessionUser?.firstName ||
    resolveFirstName(sessionUser)
  );
}

export function getAuthMiddleName() {
  return normalizeText(
    sessionUser?.middle_name ||
    sessionUser?.mname ||
    sessionUser?.middleName ||
    resolveMiddleName(sessionUser)
  );
}

export function getAuthSurname() {
  return normalizeText(
    sessionUser?.surname ||
    sessionUser?.lname ||
    sessionUser?.last_name ||
    sessionUser?.lastName ||
    resolveSurname(sessionUser)
  );
}

export function getAuthFullName(fallbackValue = "") {
  const fullName = normalizeText(
    sessionUser?.fullName ||
    resolveFullName(sessionUser)
  );
  return fullName || normalizeText(fallbackValue);
}

export function getAuthUsername(fallbackValue = "") {
  const username = normalizeText(sessionUser?.username);
  return username || normalizeText(fallbackValue);
}

export function getAuthPhoneNumber(fallbackValue = "") {
  const phoneNumber = normalizePhoneNumber(sessionUser?.phoneNumber);
  return phoneNumber || normalizePhoneNumber(fallbackValue);
}

export function getAuthEmail(fallbackValue = "") {
  const email = normalizeText(sessionUser?.email);
  return email || normalizeText(fallbackValue);
}

export function isGuestUser() {
  return Boolean(sessionUser?.isGuest || sessionUser?.role === "guest");
}

export function isGuestVerified() {
  if (!sessionUser) return false;
  return Boolean(sessionUser?.isVerified);
}

export function clearAuthToken() {
  sessionToken = "";
  sessionUser = null;
  clearAllCache();
  notifyAuthState(null);
}


