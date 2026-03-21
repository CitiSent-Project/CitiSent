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
      "Unable to resolve account from the provided identifier. Please login using your email.",
      StatusCodes.BAD_REQUEST,
    );
  }

  return profileEmail;
}

export const authService = {
  async register(payload) {
    const normalizedEmail = normalizeEmail(payload.email);

    const signUpData = await authRepository.registerWithEmailPassword({
      email: normalizedEmail,
      password: payload.password,
      userMetadata: {
        username: payload.username,
        phoneNumber: payload.phoneNumber,
      },
    });

    const userId = signUpData?.user?.id;

    let profile = null;
    if (userId && signUpData?.session?.access_token) {
      profile = await authRepository.upsertProfileByUserId(
        userId,
        {
          email: normalizedEmail,
          username: payload.username,
          phone_number: payload.phoneNumber
            ? normalizePhoneNumber(payload.phoneNumber)
            : null,
          age: payload.age ?? null,
          gender: payload.gender ?? null,
          client_type: payload.clientType ?? null,
        },
        signUpData?.session?.access_token,
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
