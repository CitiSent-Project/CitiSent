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

function assertAccountIsActive(profile) {
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
    throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
  }

  return profileEmail;
}

export const authService = {
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

    assertAccountIsActive(profile);

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
      .catch(() => {});

    return {
      activated: true,
      email: activatedProfile?.email || verifiedToken.email,
      message: "Your CitiSent account is active. You can now sign in.",
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
};
