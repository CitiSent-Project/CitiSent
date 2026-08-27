import { usersRepository } from "./users.repository.js";
import { buildActor } from "../../shared/auth/roleAccess.js";
import { normalizeNamePart } from "../../shared/utils/name.js";
import { AppError } from "../../shared/errors/appError.js";
import { StatusCodes } from "http-status-codes";

function normalizePhoneNumber(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeOptionalString(value) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

function normalizeCityInput(value) {
  const normalized = normalizeOptionalString(value);
  if (!normalized) {
    return null;
  }

  const compact = normalized.toLowerCase().replace(/[\s.]/g, "");
  if (compact === "stotomas" || compact === "santotomas") {
    return "Sto. Tomas";
  }

  return normalized;
}

function assertValidCity(value) {
  if (!value) {
    return;
  }

  if (value !== "Sto. Tomas") {
    throw new AppError("City must be Sto. Tomas.", StatusCodes.BAD_REQUEST);
  }
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
    console.log("[DEBUG] updateCurrentUser - incoming payload:", payload);
    const normalizedFname =
      payload.fname !== undefined ? normalizeNamePart(payload.fname) : undefined;
    const normalizedMname =
      payload.mname !== undefined ? normalizeNamePart(payload.mname) : undefined;
    const normalizedLname =
      payload.lname !== undefined ? normalizeNamePart(payload.lname) : undefined;
    const normalizedBarangay =
      payload.barangay !== undefined
        ? normalizeOptionalString(payload.barangay)
        : undefined;
    const normalizedCity =
      payload.city !== undefined ? normalizeCityInput(payload.city) : undefined;
    const normalizedProvince =
      payload.province !== undefined
        ? normalizeOptionalString(payload.province)
        : undefined;

    if (normalizedCity !== undefined) {
      assertValidCity(normalizedCity);
    }

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
      ...(normalizedFname !== undefined ? { fname: normalizedFname } : {}),
      ...(normalizedMname !== undefined ? { mname: normalizedMname } : {}),
      ...(normalizedLname !== undefined ? { lname: normalizedLname } : {}),
      ...(payload.email !== undefined ? { email: payload.email } : {}),
      ...(normalizedBarangay !== undefined ? { barangay: normalizedBarangay } : {}),
      ...(normalizedCity !== undefined ? { city: normalizedCity } : {}),
      ...(normalizedProvince !== undefined ? { province: normalizedProvince } : {}),
    };

    console.log("[DEBUG] updateCurrentUser - updatePayload:", updatePayload);
    try { require('fs').appendFileSync('backend_debug.log', JSON.stringify({ incoming: payload, update: updatePayload }) + '\n'); } catch (e) {}
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
