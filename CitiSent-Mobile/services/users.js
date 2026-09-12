import { api } from "./api";

export const usersApi = {
  async deleteCurrentUser() {
    return api.delete("/users/me");
  },

  async changePassword({ currentPassword, newPassword }) {
    return api.post("/auth/change-password", {
      currentPassword,
      newPassword,
    });
  },

  async exportCurrentUser() {
    return api.get("/users/me/export");
  },
};
