import { AppError } from "../../shared/errors/appError.js";
import { StatusCodes } from "http-status-codes";
import { authRepository } from "./auth.repository.js";

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizePhoneNumber(value) {
  return String(value || "").replace(/\D/g, "");
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
    user: {
      id: user?.id,
      email: user?.email || profile?.email || null,
      role: user?.role || "authenticated",
      username: profile?.username || user?.user_metadata?.username || null,
      phoneNumber:
        profile?.phone_number ||
        user?.phone ||
        user?.user_metadata?.phoneNumber ||
        null,
      age: profile?.age ?? null,
      gender: profile?.gender ?? null,
      clientType: profile?.client_type ?? null,
    },
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

  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const candidateIdentifier =
    normalizedIdentifier || username || normalizedPhone;

  if (!candidateIdentifier) {
    throw new AppError("Login identifier is required", StatusCodes.BAD_REQUEST);
  }

  const profile =
    await authRepository.getProfileByIdentifier(candidateIdentifier);
  const profileEmail = normalizeEmail(profile?.email);

  if (!profileEmail) {
    throw new AppError(
      "Unable to resolve account from username or phone number. Please check your details and try again.",
      StatusCodes.BAD_REQUEST,
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

    await assertRegistrationIdentifiersAreUnique({
      username: payload.username,
      phoneNumber: normalizedPhoneNumber,
    });

    const profilePayload = {
      email: normalizedEmail,
      username: payload.username,
      phone_number: normalizedPhoneNumber,
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

    return {
      id: authUser.id,
      email: authUser.email || profile?.email || null,
      role: authUser.role || "authenticated",
      username: profile?.username || null,
      phoneNumber: profile?.phone_number || null,
      age: profile?.age ?? null,
      gender: profile?.gender ?? null,
      clientType: profile?.client_type ?? null,
    };
  },
};
