import { usersRepository } from "./users.repository.js";
import { buildActor } from "../../shared/auth/roleAccess.js";

function normalizePhoneNumber(value) {
  return String(value || "").replace(/\D/g, "");
}

function toCurrentUserResponse(authUser, profile) {
  return buildActor({
    authUser,
    profile,
  });
}

export const usersService = {
  async getCurrentUser(authUser, accessToken) {
    const profile = await usersRepository.getProfileByUserId(
      authUser.id,
      accessToken,
    );
    return toCurrentUserResponse(authUser, profile);
  },

  async updateCurrentUser(authUser, payload, accessToken) {
    const updatePayload = {
      ...(payload.username !== undefined ? { username: payload.username } : {}),
      ...(payload.phoneNumber !== undefined
        ? {
            phone_number: payload.phoneNumber
              ? normalizePhoneNumber(payload.phoneNumber)
              : null,
          }
        : {}),
      ...(payload.age !== undefined ? { age: payload.age } : {}),
      ...(payload.gender !== undefined ? { gender: payload.gender } : {}),
      ...(payload.clientType !== undefined
        ? { client_type: payload.clientType }
        : {}),
      ...(payload.avatarUrl !== undefined
        ? { avatar_url: payload.avatarUrl }
        : {}),
      ...(payload.fullName !== undefined
        ? { full_name: payload.fullName }
        : {}),
      ...(payload.email !== undefined ? { email: payload.email } : {}),
      ...(payload.address !== undefined ? { address: payload.address } : {}),
    };

    const profile = await usersRepository.upsertProfileByUserId(
      authUser.id,
      updatePayload,
      accessToken,
    );
    return toCurrentUserResponse(authUser, profile);
  },

  async deleteCurrentUser(authUser) {
    await usersRepository.deleteAccountByUserId(authUser.id);

    return {
      deleted: true,
      userId: authUser.id,
    };
  },
};
