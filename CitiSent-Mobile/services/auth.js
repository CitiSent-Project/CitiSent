import { api } from "./api";

// TODO: Remove this temporary local test account before production release.
const TEMP_TEST_ACCOUNT = {
  username: "admin",
  password: "admin123",
};

const TEMP_TEST_LOGIN_RESPONSE = {
  token: "temp-test-token",
  user: {
    username: TEMP_TEST_ACCOUNT.username,
    role: "admin",
  },
};

export const authApi = {
  // login: (payload) => api.post("/auth/login", payload),

  // TODO: Remove this temporary local test account before production release.
  login: async (payload) => {
    if (
      payload?.username?.trim() === TEMP_TEST_ACCOUNT.username &&
      payload?.password === TEMP_TEST_ACCOUNT.password
    ) {
      return TEMP_TEST_LOGIN_RESPONSE;
    }

    return api.post("/auth/login", payload);
  },
  register: (payload) => api.post("/auth/register", payload),
};
