import { api } from "./api";
import { parseLoginIdentifier } from "../utils/authIdentifier";
import {
  clearAuthToken,
  setAuthToken,
  setAuthUser,
  getAuthUser,
  getAuthToken,
  isJwtExpired,
  getDeviceGuestCredential,
  setDeviceGuestCredential,
} from "./authSession";
import { resetAdminMessageState } from "./adminMessageState";

const CORE_REGISTER_FIELDS = ["username", "email", "password"];
let inFlightGuestPromise = null;

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
    // 1. Guard against concurrent duplicate requests (e.g. rapid taps)
    if (inFlightGuestPromise) {
      return inFlightGuestPromise;
    }

    inFlightGuestPromise = (async () => {
      try {
        // 2. Check if the active in-memory session is already a valid guest session
        const activeUser = getAuthUser();
        const activeToken = getAuthToken();
        if (activeUser?.isGuest && activeToken && !isJwtExpired(activeToken)) {
          return { token: activeToken, user: activeUser };
        }

        // 3. Check persistent device guest credentials
        const savedCredential = await getDeviceGuestCredential();

        // 3a. If saved credential has an unexpired active token and user, reuse immediately
        if (
          savedCredential?.token &&
          !isJwtExpired(savedCredential.token) &&
          savedCredential?.user
        ) {
          setAuthToken(savedCredential.token);
          setAuthUser(savedCredential.user, {
            fallbackUsername: "Guest",
          });
          return { token: savedCredential.token, user: savedCredential.user };
        }

        // 3b. Request a fresh or recovered guest session from the backend
        const requestPayload = {};
        if (savedCredential?.recoveryToken) {
          requestPayload.recoveryToken = savedCredential.recoveryToken;
        }
        if (savedCredential?.guestId) {
          requestPayload.guestId = savedCredential.guestId;
        }

        const response = await api.post("/auth/guest", requestPayload);
        const authPayload = unwrapAuthPayload(response);

        if (authPayload?.token) {
          setAuthToken(authPayload.token);
          setAuthUser(authPayload.user, {
            fallbackUsername: "Guest",
          });
        }

        // Persist device guest credential for future reuse across logouts and app restarts
        if (authPayload?.user?.id) {
          await setDeviceGuestCredential({
            guestId: authPayload.user.id,
            recoveryToken: authPayload.recoveryToken || savedCredential?.recoveryToken || null,
            token: authPayload.token || savedCredential?.token || null,
            user: authPayload.user,
          });
        }

        return authPayload;
      } catch (error) {
        // Offline recovery fallback: check if we have a saved device guest credential
        const savedCredential = await getDeviceGuestCredential();
        if (savedCredential?.user) {
          if (savedCredential.token) {
            setAuthToken(savedCredential.token);
          }
          setAuthUser(savedCredential.user, {
            fallbackUsername: "Guest",
          });
          return { token: savedCredential.token || null, user: savedCredential.user };
        }

        // Complete offline fallback for first-time guest
        const fallbackGuestId = "guest-" + Date.now();
        const guestUser = {
          id: fallbackGuestId,
          role: "guest",
          isGuest: true,
          username: "Guest",
        };
        setAuthUser(guestUser);
        return { user: guestUser };
      } finally {
        inFlightGuestPromise = null;
      }
    })();

    return inFlightGuestPromise;
  },
};


