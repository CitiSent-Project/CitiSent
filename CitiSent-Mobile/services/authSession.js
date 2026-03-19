let sessionToken = "";

function normalizeToken(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function setAuthToken(token) {
  sessionToken = normalizeToken(token);
}

export function getAuthToken() {
  return sessionToken;
}

export function clearAuthToken() {
  sessionToken = "";
}
