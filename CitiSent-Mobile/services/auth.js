import { api } from "./api";
import { parseLoginIdentifier } from "../utils/authIdentifier";
import { clearAuthToken, setAuthToken } from "./authSession";

// TODO: Remove this temporary local test account before production release.
const TEMP_TEST_ACCOUNT = {
  username: "admin",
  phoneNumber: "09123456789",
  password: "admin123",
};

const TEMP_TEST_LOGIN_RESPONSE = {
  token: "temp-test-token",
  user: {
    username: TEMP_TEST_ACCOUNT.username,
    phoneNumber: TEMP_TEST_ACCOUNT.phoneNumber,
    role: "admin",
  },
};

const CORE_REGISTER_FIELDS = ["username", "email", "password"];

function pickCoreRegisterPayload(payload) {
  return CORE_REGISTER_FIELDS.reduce((acc, key) => {
    if (payload && payload[key] !== undefined) {
      acc[key] = payload[key];
    }

    return acc;
  }, {});
}

function hasDemographicFields(payload) {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  return Object.keys(payload).some(
    (key) => !CORE_REGISTER_FIELDS.includes(key),
  );
}

function isLikelySchemaRejection(error) {
  const message = String(error?.message || "").toLowerCase();

  return (
    message.includes("request failed (400)") ||
    message.includes("request failed (422)") ||
    message.includes("unknown") ||
    message.includes("not allowed") ||
    message.includes("unexpected") ||
    message.includes("validation")
  );
}

export const authApi = {
  // login: (payload) => api.post("/auth/login", payload),

  // TODO: Remove this temporary local test account before production release.
  login: async (payload) => {
    const parsedIdentifier = parseLoginIdentifier(
      payload?.identifier || payload?.username || payload?.phoneNumber,
    );
    const normalizedUsername = (
      payload?.username ||
      parsedIdentifier.username ||
      ""
    ).trim();
    const normalizedPhoneNumber =
      parsedIdentifier.phoneNumber ||
      String(payload?.phoneNumber || "").replace(/\D/g, "");

    if (
      (normalizedUsername === TEMP_TEST_ACCOUNT.username ||
        normalizedPhoneNumber === TEMP_TEST_ACCOUNT.phoneNumber) &&
      payload?.password === TEMP_TEST_ACCOUNT.password
    ) {
      setAuthToken(TEMP_TEST_LOGIN_RESPONSE.token);
      return TEMP_TEST_LOGIN_RESPONSE;
    }

    const response = await api.post("/auth/login", {
      ...payload,
      identifier: parsedIdentifier.raw,
      username: normalizedUsername,
      phoneNumber: normalizedPhoneNumber,
    });

    setAuthToken(response?.token);
    return response;
  },
  register: async (payload) => {
    try {
      return await api.post("/auth/register", payload);
    } catch (error) {
      if (!hasDemographicFields(payload) || !isLikelySchemaRejection(error)) {
        throw error;
      }

      const corePayload = pickCoreRegisterPayload(payload);
      return api.post("/auth/register", corePayload);
    }
  },

  logout: () => {
    clearAuthToken();
  },
};
