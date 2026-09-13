import { api } from "./api";
import { parseLoginIdentifier } from "../utils/authIdentifier";
import { clearAuthToken, setAuthToken, setAuthUser, getAuthUser } from "./authSession";
import { resetAdminMessageState } from "./adminMessageState";

const CORE_REGISTER_FIELDS = ["username", "email", "password"];

function unwrapAuthPayload(response) {
  if (!response || typeof response !== "object") {
    return null;
  }

  if (response.data && typeof response.data === "object") {
    return response.data;
  }

  return response;
}

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

    const response = await api.post("/auth/login", {
      ...payload,
      identifier: parsedIdentifier.raw,
      username: normalizedUsername,
      phoneNumber: normalizedPhoneNumber,
    });

    const authPayload = unwrapAuthPayload(response);
    setAuthToken(authPayload?.token);
    setAuthUser(authPayload?.user, {
      fallbackUsername: normalizedUsername,
      fallbackPhoneNumber: normalizedPhoneNumber,
    });

    return authPayload;
  },
  register: async (payload) => {
    const response = await api.post("/auth/register", payload);
    return unwrapAuthPayload(response);
  },

  logout: () => {
    resetAdminMessageState();
    clearAuthToken();
  },

  requestOtp: async (email) => {
    const response = await api.post("/auth/request-otp", { email });
    return response?.data ?? response;
  },

  verifyOtp: async (email, otp) => {
    const response = await api.post("/auth/verify-otp", { email, otp });
    return response?.data ?? response;
  },

  resetPasswordWithOtp: async (resetToken, password) => {
    const response = await api.post("/auth/reset-password-otp", {
      resetToken,
      password,
    });
    return response?.data ?? response;
  },

  continueAsGuest: async () => {
    try {
      const existingUser = getAuthUser();
      const existingGuestId =
        existingUser?.isGuest && existingUser?.id && !existingUser.id.startsWith("guest-")
          ? existingUser.id
          : null;

      const response = await api.post("/auth/guest", {
        ...(existingGuestId ? { guestId: existingGuestId } : {}),
      });
      const authPayload = unwrapAuthPayload(response);
      if (authPayload?.token) {
        setAuthToken(authPayload.token);
        setAuthUser(authPayload.user, {
          fallbackUsername: "Guest",
        });
      }
      return authPayload;
    } catch {
      // Fallback guest session if offline
      const guestUser = {
        id: "guest-" + Date.now(),
        role: "guest",
        isGuest: true,
        username: "Guest",
      };
      setAuthUser(guestUser);
      return { user: guestUser };
    }
  },
};

