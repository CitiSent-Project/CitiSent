import { AppError } from "../../shared/errors/appError.js";
import { StatusCodes } from "http-status-codes";
import { authRepository } from "./auth.repository.js";
import {
  buildActor,
  normalizeAccountType,
  normalizeUserRole,
} from "../../shared/auth/roleAccess.js";
import { departmentsService } from "../departments/departments.service.js";

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizePhoneNumber(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeOptionalString(value) {
  const normalizedValue = String(value || "").trim();
  return normalizedValue || null;
}

async function resolveProfileEmailFromCandidates(candidates) {
  const dedupedCandidates = [...new Set(candidates.filter(Boolean))];

  for (const candidate of dedupedCandidates) {
    const profile = await authRepository.getProfileByIdentifier(candidate);
    const profileEmail = normalizeEmail(profile?.email);

    if (profileEmail) {
      return profileEmail;
    }
  }

  return "";
}

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

async function assertRegistrationIdentifiersAreUnique({
  username,
  phoneNumber,
}) {
  const normalizedUsername = normalizeUsername(username);
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

  if (normalizedUsername) {
    const existing =
      await authRepository.getProfileByIdentifier(normalizedUsername);

    const existingUsername = normalizeUsername(existing?.username);
    if (existingUsername && existingUsername === normalizedUsername) {
      throw new AppError("Username is already in use", StatusCodes.CONFLICT);
    }
  }

  if (normalizedPhoneNumber) {
    const existing = await authRepository.getProfileByIdentifier(
      normalizedPhoneNumber,
    );

    const existingPhoneNumber = normalizePhoneNumber(existing?.phone_number);
    if (existingPhoneNumber && existingPhoneNumber === normalizedPhoneNumber) {
      throw new AppError(
        "Phone number is already in use",
        StatusCodes.CONFLICT,
      );
    }
  }
}

function toUserResponse({ user, session, profile }) {
  return {
    token: session?.access_token || null,
    user: buildActor({
      authUser: user,
      profile,
    }),
  };
}

async function resolveLoginEmail({ identifier, email, username, phoneNumber }) {
  const normalizedEmail = normalizeEmail(email);
  if (normalizedEmail) {
    return normalizedEmail;
  }

  const normalizedIdentifier = String(identifier || "").trim();
  if (normalizedIdentifier.includes("@")) {
    return normalizeEmail(normalizedIdentifier);
  }

  const normalizedUsername = String(username || "").trim();
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const normalizedIdentifierPhone = normalizePhoneNumber(normalizedIdentifier);

  const candidateIdentifier =
    normalizedIdentifier || normalizedUsername || normalizedPhone;

  if (!candidateIdentifier) {
    throw new AppError("Login identifier is required", StatusCodes.BAD_REQUEST);
  }

  const profileEmail = await resolveProfileEmailFromCandidates([
    candidateIdentifier,
    normalizedUsername,
    normalizedPhone,
    normalizedIdentifierPhone,
  ]);

  if (!profileEmail) {
    throw new AppError(
      "Invalid credentials",
      StatusCodes.UNAUTHORIZED,
    );
  }

  return profileEmail;
}

export const authService = {
  async register(payload) {
    const normalizedEmail = normalizeEmail(payload.email);
    const normalizedPhoneNumber = payload.phoneNumber
      ? normalizePhoneNumber(payload.phoneNumber)
      : null;
    const normalizedRole = normalizeUserRole(payload.role);
    const accountType = normalizeAccountType(payload.accountType, normalizedRole);
    const rawDepartmentValue = payload.departmentLabel || payload.departmentId;
    const normalizedDepartmentValue = String(rawDepartmentValue || "").trim();

    const matchedDepartment = normalizedDepartmentValue
      ? await departmentsService.getActiveDepartmentByValue({
          value: normalizedDepartmentValue,
        })
      : null;

    if (normalizedDepartmentValue && !matchedDepartment) {
      throw new AppError(
        "Invalid or inactive department selection.",
        StatusCodes.BAD_REQUEST,
      );
    }

    await assertRegistrationIdentifiersAreUnique({
      username: payload.username,
      phoneNumber: normalizedPhoneNumber,
    });
    const profilePayload = {
      email: normalizedEmail,
      username: payload.username,
      full_name: normalizeOptionalString(payload.fullName),
      phone_number: normalizedPhoneNumber,
      address: normalizeOptionalString(payload.address),
      role: normalizedRole || null,
      account_type: accountType,
      department_id: matchedDepartment?.slug || normalizeOptionalString(payload.departmentId),
      department_label:
        matchedDepartment?.name || normalizeOptionalString(payload.departmentLabel),
      age: payload.age ?? null,
      gender: payload.gender ?? null,
      client_type: payload.clientType ?? null,
      address: payload.address ?? null,
    };

    const signUpData = await authRepository.registerWithEmailPassword({
      email: normalizedEmail,
      password: payload.password,
      userMetadata: {
        username: payload.username,
        phoneNumber: normalizedPhoneNumber,
      },
    });

    const userId = signUpData?.user?.id;
    const sessionToken = signUpData?.session?.access_token;

    let profile = null;
    if (userId && sessionToken) {
      profile = await authRepository.upsertProfileByUserId(
        userId,
        profilePayload,
        sessionToken,
      );
    }

    if (!profile && userId) {
      profile = await authRepository.upsertProfileByUserIdWithAdmin(
        userId,
        profilePayload,
      );
    }

    return toUserResponse({
      user: signUpData?.user,
      session: signUpData?.session,
      profile,
    });
  },

  async login(payload) {
    const resolvedEmail = await resolveLoginEmail(payload);

    const signInData = await authRepository.loginWithEmailPassword({
      email: resolvedEmail,
      password: payload.password,
    });

    const userId = signInData?.user?.id;
    const profile = userId
      ? await authRepository.getProfileByUserId(
          userId,
          signInData?.session?.access_token,
        )
      : null;

    return toUserResponse({
      user: signInData?.user,
      session: signInData?.session,
      profile,
    });
  },

  async forgotPassword({ email }) {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      throw new AppError("Email is required", StatusCodes.BAD_REQUEST);
    }

    await authRepository.requestPasswordReset({ email: normalizedEmail });

    return {
      sent: true,
      message: "If this email is registered, a reset link has been sent.",
    };
  },

  async me(authUser, accessToken) {
    const profile = await authRepository.getProfileByUserId(
      authUser.id,
      accessToken,
    );

    return buildActor({
      authUser,
      profile,
    });
  },
};
