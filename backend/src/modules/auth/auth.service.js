import { AppError } from "../../shared/errors/appError.js";
import { StatusCodes } from "http-status-codes";
import { authRepository } from "./auth.repository.js";
import {
  buildActor,
  normalizeAccountType,
  normalizeUserRole,
} from "../../shared/auth/roleAccess.js";
import { departmentsService } from "../departments/departments.service.js";
import { normalizeNamePart } from "../../shared/utils/name.js";
import {
  hashInvitationTokenId,
  verifyAccountActivationToken,
} from "../../shared/security/invitationTokens.js";
import {
  createPasswordResetToken,
  verifyPasswordResetToken,
} from "../../shared/security/passwordResetTokens.js";
import {
  sendPasswordResetEmail,
  buildResetPasswordUrl,
  sendOtpEmail,
} from "../../shared/email/mailer.js";
import { otpStore_ } from "../../shared/security/otp.store.js";
import { cacheService } from "../../shared/cache/cacheService.js";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "../../config/env.js";
import { signGuestToken } from "../../shared/security/guestTokens.js";

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

  const profiles = await Promise.all(
    dedupedCandidates.map((candidate) =>
      authRepository.getProfileByIdentifier(candidate)
    )
  );

  for (const profile of profiles) {
    const profileEmail = normalizeEmail(profile?.email);

    if (profileEmail) {
      return { email: profileEmail, profile };
    }
  }

  return { email: "", profile: null };
}

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function assertAccountIsActive(profile) {
  if (String(profile?.account_status || "").trim().toLowerCase() === "banned") {
    throw new AppError(
      "Your account has been banned.",
      StatusCodes.FORBIDDEN,
    );
  }

  if (String(profile?.activation_status || "").trim().toLowerCase() === "pending") {
    throw new AppError(
      "Please set up your password using the invitation link before logging in.",
      StatusCodes.FORBIDDEN,
    );
  }
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

async function resolveLoginContext({ identifier, email, username, phoneNumber }) {
  const normalizedEmail = normalizeEmail(email);
  if (normalizedEmail) {
    return { email: normalizedEmail, profile: null };
  }

  const normalizedIdentifier = String(identifier || "").trim();
  if (normalizedIdentifier.includes("@")) {
    return { email: normalizeEmail(normalizedIdentifier), profile: null };
  }

  const normalizedUsername = String(username || "").trim();
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const normalizedIdentifierPhone = normalizePhoneNumber(normalizedIdentifier);

  const candidateIdentifier =
    normalizedIdentifier || normalizedUsername || normalizedPhone;

  if (!candidateIdentifier) {
    throw new AppError("Login identifier is required", StatusCodes.BAD_REQUEST);
  }

  const profileContext = await resolveProfileEmailFromCandidates([
    candidateIdentifier,
    normalizedUsername,
    normalizedPhone,
    normalizedIdentifierPhone,
  ]);

  if (!profileContext.email) {
    throw new AppError("Incorrect username or phone number.", StatusCodes.UNAUTHORIZED);
  }

  return profileContext;
}

export const authService = {
  /**
   * OTP-based forgot password: Step 1 — request OTP.
   * Always responds with { sent: true } to prevent email enumeration.
   */
  async requestOtp(email) {
    const normalizedEmail = String(email || "").trim().toLowerCase();

    // Rate-limit check (throws if exceeded)
    try {
      otpStore_.checkSendRateLimit(normalizedEmail);
    } catch (err) {
      throw new AppError(err.message, StatusCodes.TOO_MANY_REQUESTS);
    }

    const profile = await authRepository.getProfileByEmail(normalizedEmail);

    if (!profile) {
      // Silent success — do not reveal whether email exists
      return { sent: true };
    }

    const plainOtp = otpStore_.createOtp(normalizedEmail);

    await sendOtpEmail({
      toEmail: profile.email,
      recipientName: profile.fname,
      otp: plainOtp,
    });

    return { sent: true };
  },

  /**
   * OTP-based forgot password: Step 2 — verify OTP.
   * On success returns a short-lived reset session JWT.
   */
  async verifyOtp(email, otp) {
    const normalizedEmail = String(email || "").trim().toLowerCase();

    try {
      otpStore_.verifyOtp(normalizedEmail, otp);
    } catch (err) {
      throw new AppError(err.message, StatusCodes.BAD_REQUEST);
    }

    if (!env.INVITATION_JWT_SECRET) {
      throw new AppError(
        "Password reset is not configured.",
        StatusCodes.SERVICE_UNAVAILABLE,
      );
    }

    // Issue a short-lived reset session token (5 min)
    const resetToken = jwt.sign(
      { email: normalizedEmail, purpose: "otp_reset" },
      env.INVITATION_JWT_SECRET,
      { expiresIn: "5m" },
    );

    return { resetToken };
  },

  /**
   * OTP-based forgot password: Step 3 — reset password with OTP-issued token.
   */
  async resetPasswordWithOtp(resetToken, newPassword) {
    if (!env.INVITATION_JWT_SECRET) {
      throw new AppError(
        "Password reset is not configured.",
        StatusCodes.SERVICE_UNAVAILABLE,
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, env.INVITATION_JWT_SECRET);
    } catch (err) {
      const isExpired = err?.name === "TokenExpiredError";
      throw new AppError(
        isExpired
          ? "Your reset session has expired. Please start over."
          : "Invalid reset session. Please start over.",
        StatusCodes.UNAUTHORIZED,
      );
    }

    if (decoded?.purpose !== "otp_reset" || !decoded?.email) {
      throw new AppError("Invalid reset session.", StatusCodes.UNAUTHORIZED);
    }

    const profile = await authRepository.getProfileByEmail(decoded.email);
    if (!profile) {
      throw new AppError("Account not found.", StatusCodes.NOT_FOUND);
    }

    await authRepository.updateAuthUserPassword(profile.user_id, newPassword);

    return { success: true };
  },

  async forgotPassword(email) {
    const profile = await authRepository.getProfileByEmail(email);
    if (!profile) {
      // Don't leak user existence status to potential attackers
      return { sent: true };
    }

    const resetToken = createPasswordResetToken({
      userId: profile.user_id,
      email: profile.email,
    });
    const resetUrl = buildResetPasswordUrl(resetToken.token);

    await sendPasswordResetEmail({
      toEmail: profile.email,
      recipientName: profile.fname,
      resetUrl,
    });

    return {
      sent: true,
      message: "If this email is registered, a reset link has been sent.",
    };
  },

  async resetPassword(token, newPassword) {
    const decoded = verifyPasswordResetToken(token);
    if (!decoded) {
      throw new AppError(
        "Invalid or expired reset token",
        StatusCodes.UNAUTHORIZED,
      );
    }

    // Double check the email/userId still maps to a valid profile
    const profile = await authRepository.getProfileByEmail(decoded.email);
    if (!profile || profile.user_id !== decoded.userId) {
      throw new AppError(
        "Reset token no longer valid for this user",
        StatusCodes.UNAUTHORIZED,
      );
    }

    await authRepository.updateAuthUserPassword(profile.user_id, newPassword);

    return { success: true };
  },

  async register(payload) {
    const normalizedEmail = normalizeEmail(payload.email);
    const normalizedPhoneNumber = payload.phoneNumber
      ? normalizePhoneNumber(payload.phoneNumber)
      : null;
    const normalizedFname = normalizeNamePart(payload.fname);
    const normalizedMname = normalizeNamePart(payload.mname);
    const normalizedLname = normalizeNamePart(payload.lname);
    const normalizedRole = normalizeUserRole(payload.role);
    const accountType = normalizeAccountType(
      payload.accountType,
      normalizedRole,
    );
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
      fname: normalizedFname,
      mname: normalizedMname,
      lname: normalizedLname,
      phone_number: normalizedPhoneNumber,
      role: normalizedRole || null,
      account_type: accountType,
      department_id:
        matchedDepartment?.slug || normalizeOptionalString(payload.departmentId),
      department_label:
        matchedDepartment?.name || normalizeOptionalString(payload.departmentLabel),
      age: payload.age ?? null,
      gender: payload.gender ?? null,
      client_type: payload.clientType ?? null,
      barangay: payload.barangay ?? null,
      avatar_url: payload.profileImage ?? null,
    };

    const rawUserMetadata = {
      username: payload.username,
      fname: normalizedFname,
      mname: normalizedMname,
      lname: normalizedLname,
      phoneNumber: normalizedPhoneNumber,
      phone_number: normalizedPhoneNumber,
      barangay: payload.barangay,
      age: payload.age,
      gender: payload.gender,
      clientType: payload.clientType,
      client_type: payload.clientType,
      profileImage: payload.profileImage,
      profile_image: payload.profileImage,
      role: normalizedRole || null,
      account_type: accountType,
      department_label: payload.departmentLabel || null,
      department_id: payload.departmentId || null,
    };

    const userMetadata = Object.fromEntries(
      Object.entries(rawUserMetadata).filter(([_, v]) => v != null),
    );

    const signUpData = await authRepository.registerWithEmailPassword({
      email: normalizedEmail,
      password: payload.password,
      userMetadata,
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

  async login(payload, perf) {
    const track = (name, operation) =>
      perf?.trackStage ? perf.trackStage(name, operation) : operation();
    const loginContext = await track("identifierLookup", () =>
      resolveLoginContext(payload),
    );
    const resolvedEmail = loginContext.email;

    // Concurrently run profile resolution and Supabase authentication.
    // If identifier was username/phone, profile is already in loginContext.
    // If identifier was email, profile fetch and auth request run in parallel.
    const profilePromise = track("preAuthProfileLookup", async () => {
      const p = loginContext.profile
        ? loginContext.profile
        : await authRepository.getProfileByIdentifier(resolvedEmail);
        
      let isBanned = false;
      if (p?.user_id) {
        if (String(p.account_status || "").trim().toLowerCase() === "banned") {
          isBanned = true;
        } else {
          isBanned = await track("banLookup", () =>
            authRepository.checkActiveBanByUserId(p.user_id),
          );
        }
      }
      return { profile: p, isBanned };
    });

    const authPromise = track("supabaseAuth", () =>
      authRepository.loginWithEmailPassword({
        email: resolvedEmail,
        password: payload.password,
      }),
    ).then(
      (data) => ({ ok: true, data }),
      (err) => ({ ok: false, err }),
    );

    const [preProfileContext, authResult] = await Promise.all([
      profilePromise,
      authPromise,
    ]);

    const preProfile = preProfileContext.profile;

    // Check for active ban before handling any auth errors
    if (preProfileContext.isBanned) {
      throw new AppError(
        "Your account has been banned.",
        StatusCodes.FORBIDDEN,
      );
    }

    if (!authResult.ok) {
      throw authResult.err;
    }

    const signInData = authResult.data;
    const userId = signInData?.user?.id;
    const profile =
      userId && preProfile?.user_id === userId
        ? preProfile
        : userId
          ? await track("postAuthProfileLookup", () =>
            authRepository.getProfileByUserId(
              userId,
              signInData?.session?.access_token,
            ),
          )
          : null;

    assertAccountIsActive(profile);

    // Warm user profile cache for subsequent requests
    if (userId && profile) {
      try {
        await cacheService.setJSON(`profile:user:${userId}`, profile, 120);
      } catch {
        // Non-critical cache priming
      }
    }

    return toUserResponse({
      user: signInData?.user,
      session: signInData?.session,
      profile,
    });
  },

  async activateAccount({ token, password }) {
    const verifiedToken = verifyAccountActivationToken(token);
    const expectedTokenHash = hashInvitationTokenId(verifiedToken.tokenId);

    if (!verifiedToken.userId || !verifiedToken.email || !verifiedToken.tokenId) {
      throw new AppError("This setup link is not valid.", StatusCodes.BAD_REQUEST);
    }

    const profile = await authRepository.getProfileForActivation({
      userId: verifiedToken.userId,
      email: verifiedToken.email,
    });

    if (!profile) {
      throw new AppError("This setup link is not valid.", StatusCodes.NOT_FOUND);
    }

    if (String(profile.activation_status || "active").toLowerCase() === "active") {
      throw new AppError("This account has already been activated.", StatusCodes.CONFLICT);
    }

    if (profile.invitation_token_hash !== expectedTokenHash) {
      throw new AppError("This setup link is no longer valid.", StatusCodes.BAD_REQUEST);
    }

    await authRepository.updateAuthUserPassword({
      userId: verifiedToken.userId,
      password,
    });
    const activatedProfile = await authRepository.markProfileActivated({
      userId: verifiedToken.userId,
    });

    authRepository
      .createAccountInvitationNotification({
        adminUserId: profile.invitation_created_by_user_id,
        email: activatedProfile?.email || verifiedToken.email,
        status: "active",
      })
      .catch(() => { });

    return {
      activated: true,
      email: activatedProfile?.email || verifiedToken.email,
      message: "Your CitiSent account is active. You can now sign in.",
    };
  },

  async me(authUser, accessToken) {
    const cacheKey = `profile:user:${authUser.id}`;
    let profile = await cacheService.getJSON(cacheKey);

    if (!profile) {
      profile = await authRepository.getProfileByUserId(
        authUser.id,
        accessToken,
      );
      if (profile) {
        await cacheService.setJSON(cacheKey, profile, 120).catch(() => {});
      }
    }

    return buildActor({
      authUser,
      profile,
    });
  },

  async changePassword(authUser, { currentPassword, newPassword }) {
    if (!authUser?.email) {
      throw new AppError(
        "Unable to resolve your account email.",
        StatusCodes.BAD_REQUEST,
      );
    }

    if (currentPassword === newPassword) {
      throw new AppError(
        "New password must be different from your current password.",
        StatusCodes.BAD_REQUEST,
      );
    }

    await authRepository.changeUserPassword({
      email: authUser.email,
      currentPassword,
      newPassword,
      userId: authUser.id,
    });

    return { changed: true };
  },

  async createGuestSession(maybeGuestId = null) {
    // Ensure the guest user identity exists in auth.users and profiles.
    // Reuses existing guest if maybeGuestId is already a valid guest in the DB.
    const guestUser = await authRepository.ensureGuestUser(maybeGuestId);
    const guestId = guestUser.id;

    // Guest verification is per-submission via Cloudflare Turnstile CAPTCHA.
    const token = signGuestToken({ guestId });

    return {
      token,
      user: {
        id: guestId,
        role: "guest",
        isGuest: true,
        username: "Guest",
      },
    };
  },
};
