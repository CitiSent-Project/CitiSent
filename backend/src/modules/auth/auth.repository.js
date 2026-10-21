import crypto from "node:crypto";
import { StatusCodes } from "http-status-codes";
import {
  createAdminSupabaseClient,
  createUserSupabaseClient,
  supabase,
} from "../../config/supabase.js";
import { AppError } from "../../shared/errors/appError.js";
import { generate6DigitId } from "../../shared/utils/idGenerator.js";

const PROFILES_TABLE = "profiles";

function getDbClient(accessToken) {
  if (!accessToken) {
    return supabase;
  }

  return createUserSupabaseClient(accessToken);
}

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || ""),
  );
}

function isMissingProfilesTable(error) {
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "").toUpperCase();

  return (
    code === "42P01" ||
    message.includes("relation") ||
    message.includes("profiles")
  );
}

function isAccessDenied(error) {
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "").toUpperCase();

  return code === "42501" || message.includes("permission denied");
}

function toErrorText(error) {
  const parts = [
    error?.message,
    error?.code,
    error?.name,
    error?.details,
    error?.hint,
    error?.cause?.message,
    error?.cause?.details,
    error?.error_description,
  ]
    .filter(Boolean)
    .map((value) => String(value));

  try {
    parts.push(JSON.stringify(error));
  } catch { }

  return parts.join(" ").toLowerCase();
}

function isDuplicateAuthError(error) {
  const message = toErrorText(error);
  const code = String(error?.code || "").toUpperCase();
  const status = Number(error?.status || error?.statusCode || 0);

  return (
    code === "USER_ALREADY_EXISTS" ||
    code === "23505" ||
    message.includes("already registered") ||
    message.includes("already exists") ||
    message.includes("duplicate key") ||
    message.includes("unique constraint") ||
    (status === StatusCodes.CONFLICT && message.includes("user"))
  );
}

function getDuplicateRegistrationMessage(error) {
  const message = toErrorText(error);

  if (
    message.includes("username") ||
    message.includes("profiles_username_key")
  ) {
    return "Username is already in use";
  }

  if (
    message.includes("phone") ||
    message.includes("phone_number") ||
    message.includes("profiles_phone_number_key")
  ) {
    return "Phone number is already in use";
  }

  if (
    message.includes("email") ||
    message.includes("user_already_exists") ||
    message.includes("already registered")
  ) {
    return "Email is already registered";
  }

  return "An account with the provided credentials already exists";
}

// Supabase Auth throttles outbound auth emails (confirmation, recovery, ...)
// per project. Without custom SMTP the built-in mailer only allows a handful of
// emails per hour, so this is expected to surface during busy periods.
const EMAIL_RATE_LIMIT_CODE = "EMAIL_RATE_LIMITED";
// Supabase's email quota is windowed hourly, so an hour is the safe upper bound.
const EMAIL_RATE_LIMIT_RETRY_AFTER_SECONDS = 3600;

function isEmailSendRateLimitError(error) {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();
  const status = Number(error?.status || error?.statusCode || 0);

  return (
    code === "over_email_send_rate_limit" ||
    (status === StatusCodes.TOO_MANY_REQUESTS &&
      message.includes("email") &&
      message.includes("rate limit"))
  );
}

function toEmailRateLimitError() {
  // Deliberately omit `details`: the raw Supabase error must never be echoed
  // to the client, and errorHandler already logs 4xx errors exactly once.
  const error = new AppError(
    "We couldn't send your verification email because too many sign-up emails were requested. Please wait a while before trying again.",
    StatusCodes.TOO_MANY_REQUESTS,
  );
  error.code = EMAIL_RATE_LIMIT_CODE;
  error.publicCode = EMAIL_RATE_LIMIT_CODE;
  error.retryAfterSeconds = EMAIL_RATE_LIMIT_RETRY_AFTER_SECONDS;
  return error;
}

function toRegisterError(error) {
  const message = toErrorText(error);
  const status = Number(error?.status || error?.statusCode || 0);

  if (isEmailSendRateLimitError(error)) {
    return toEmailRateLimitError();
  }

  if (isDuplicateAuthError(error)) {
    return new AppError(
      getDuplicateRegistrationMessage(error),
      StatusCodes.CONFLICT,
      error,
    );
  }

  if (
    status === StatusCodes.BAD_REQUEST ||
    message.includes("invalid email") ||
    message.includes("email address") ||
    message.includes("password") ||
    message.includes("weak") ||
    message.includes("validation")
  ) {
    return new AppError(
      "Invalid registration details. Please review your input and try again.",
      StatusCodes.BAD_REQUEST,
      error,
    );
  }

  if (
    status === StatusCodes.TOO_MANY_REQUESTS ||
    message.includes("rate limit") ||
    message.includes("too many")
  ) {
    return new AppError(
      "Too many registration attempts. Please try again shortly.",
      StatusCodes.TOO_MANY_REQUESTS,
      error,
    );
  }

  return toGatewayError("Failed to register account", error);
}

function isEmailNotConfirmedAuthError(error) {
  const message = String(error?.message || "").toLowerCase();

  return (
    message.includes("email not confirmed") ||
    message.includes("email not verified")
  );
}

function isInvalidCredentialsAuthError(error) {
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "").toLowerCase();

  return (
    code === "invalid_credentials" ||
    code === "invalid_grant" ||
    message.includes("invalid login credentials") ||
    message.includes("invalid credentials")
  );
}

function isInvalidApiKeyAuthError(error) {
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "").toLowerCase();

  return code === "invalid_api_key" || message.includes("invalid api key");
}

function toGatewayError(message, details) {
  return new AppError(message, StatusCodes.BAD_GATEWAY, details);
}

function getAdminDbOrThrow() {
  const adminDb = createAdminSupabaseClient();

  if (!adminDb) {
    throw new AppError(
      "Account activation requires SUPABASE_SERVICE_ROLE_KEY",
      StatusCodes.SERVICE_UNAVAILABLE,
    );
  }

  return adminDb;
}

async function queryProfileByIdentifier(db, identifier) {
  const normalized = String(identifier || "").trim();
  if (!normalized) return { data: null, error: null };

  const { data, error } = await db
    .from(PROFILES_TABLE)
    .select("*")
    .or(
      `email.eq.${normalized},username.eq.${normalized},phone_number.eq.${normalized},email.ilike.${normalized},username.ilike.${normalized}`,
    )
    .limit(1)
    .maybeSingle();

  return { data, error };
}

async function queryProfileByEmail(db, email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return { data: null, error: null };

  const { data, error } = await db
    .from(PROFILES_TABLE)
    .select("*")
    .or(`email.eq.${normalized},email.ilike.${normalized}`)
    .limit(1)
    .maybeSingle();

  return { data, error };
}

async function profileExistsByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return false;
  }

  const { data, error } = await queryProfileByEmail(
    getDbClient(),
    normalizedEmail,
  );

  const adminDb = createAdminSupabaseClient();

  if (!error) {
    if (data || !adminDb) {
      return Boolean(data);
    }

    const { data: adminData, error: adminError } = await queryProfileByEmail(
      adminDb,
      normalizedEmail,
    );

    if (adminError) {
      if (isMissingProfilesTable(adminError)) {
        return false;
      }

      throw toGatewayError("Failed to verify existing profile", adminError);
    }

    return Boolean(adminData);
  }

  if (isMissingProfilesTable(error)) {
    return false;
  }

  if (!isAccessDenied(error)) {
    throw toGatewayError("Failed to verify existing profile", error);
  }

  if (!adminDb) {
    return false;
  }

  const { data: adminData, error: adminError } = await queryProfileByEmail(
    adminDb,
    normalizedEmail,
  );

  if (adminError) {
    if (isMissingProfilesTable(adminError)) {
      return false;
    }

    throw toGatewayError("Failed to verify existing profile", adminError);
  }

  return Boolean(adminData);
}

async function findAuthUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  const adminDb = createAdminSupabaseClient();
  if (!adminDb) {
    return null;
  }

  const perPage = 200;
  const maxPages = 50;
  let page = 1;

  while (page <= maxPages) {
    const { data, error } = await adminDb.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw toGatewayError("Failed to inspect authentication users", error);
    }

    const users = Array.isArray(data?.users) ? data.users : [];

    const matchedUser = users.find(
      (user) => normalizeEmail(user?.email) === normalizedEmail,
    );

    if (matchedUser) {
      return matchedUser;
    }

    if (users.length < perPage) {
      return null;
    }

    page += 1;
  }

  return null;
}

async function tryReconcileOrphanedAuthEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return false;
  }

  const adminDb = createAdminSupabaseClient();
  if (!adminDb) {
    return false;
  }

  const existingProfile = await profileExistsByEmail(normalizedEmail);
  if (existingProfile) {
    return false;
  }

  const authUser = await findAuthUserByEmail(normalizedEmail);
  if (!authUser?.id) {
    return false;
  }

  const { error } = await adminDb.auth.admin.deleteUser(authUser.id, false);

  if (error) {
    throw toGatewayError("Failed to reconcile account records", error);
  }

  return true;
}

export const authRepository = {
  async getProfileByEmail(email) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      return null;
    }

    const adminDb = createAdminSupabaseClient();
    const db = adminDb || getDbClient();
    const { data, error } = await queryProfileByEmail(db, normalizedEmail);

    if (error) {
      if (isMissingProfilesTable(error)) {
        return null;
      }
      throw toGatewayError("Failed to fetch profile by email", error);
    }

    return data || null;
  },

  async isRegisteredUserEmail(email) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      return false;
    }

    const profile = await this.getProfileByEmail(normalizedEmail);
    if (profile) {
      const accountType = String(profile.account_type || "").trim().toLowerCase();
      const role = String(profile.role || "").trim().toLowerCase();

      // Guest accounts are not considered registered user accounts
      if (accountType === "guest" || role === "guest") {
        return false;
      }

      return true;
    }

    // Secondary check: inspect Supabase Auth users for orphaned or unprofiled registered users
    const adminDb = createAdminSupabaseClient();
    if (adminDb) {
      try {
        const authUser = await findAuthUserByEmail(normalizedEmail);
        if (authUser?.id) {
          const role = String(authUser.user_metadata?.role || "").trim().toLowerCase();
          const isGuest = Boolean(authUser.user_metadata?.is_guest);
          if (role === "guest" || isGuest) {
            return false;
          }
          return true;
        }
      } catch {
        // Fall back gracefully if auth inspection fails
      }
    }

    return false;
  },

  async updateAuthUserPassword(userId, newPassword) {
    const adminDb = createAdminSupabaseClient();
    if (!adminDb) {
      throw new Error("Admin client is required to update passwords");
    }

    const { error } = await adminDb.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      throw toGatewayError("Failed to update user password", error);
    }

    return true;
  },

  async confirmUserEmail(userId) {
    const adminDb = createAdminSupabaseClient();
    if (!adminDb) {
      throw new Error("Admin client is required to confirm user emails");
    }

    const { error } = await adminDb.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });

    if (error) {
      throw toGatewayError("Failed to confirm user email", error);
    }

    return true;
  },

  async registerWithEmailPassword({ email, password, userMetadata }) {
    const adminDb = createAdminSupabaseClient();
    if (!adminDb) {
      throw new Error("Admin Supabase client is required for registration to bypass default emails.");
    }

    const signUp = () =>
      adminDb.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: userMetadata,
      });

    let { data, error } = await signUp();


    if (!error) {
      return data;
    }

    // Never reconcile (delete) or re-send on a rate-limit error: the retry
    // would only burn more of the email quota.
    if (!isEmailSendRateLimitError(error) && isDuplicateAuthError(error)) {
      const reconciled = await tryReconcileOrphanedAuthEmail(email);

      if (reconciled) {
        const retryResult = await signUp();
        data = retryResult.data;
        error = retryResult.error;

        if (!error) {
          return data;
        }
      }
    }

    // Errors are logged once, centrally, by errorHandler. Do not log the raw
    // Supabase error here (it would duplicate the entry and include stack traces).
    throw toRegisterError(error);
  },

  async loginWithEmailPassword({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (isEmailNotConfirmedAuthError(error)) {
        throw new AppError(
          "Please verify your email before logging in.",
          StatusCodes.UNAUTHORIZED,
          error,
        );
      }

      if (isInvalidCredentialsAuthError(error)) {
        throw new AppError(
          "Incorrect password.",
          StatusCodes.UNAUTHORIZED,
          error,
        );
      }

      if (isInvalidApiKeyAuthError(error)) {
        throw toGatewayError(
          "Authentication provider is misconfigured (invalid API key).",
          error,
        );
      }

      throw toGatewayError(
        "Authentication provider is currently unavailable",
        error,
      );
    }

    return data;
  },

  async requestPasswordReset({ email }) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      throw toGatewayError("Failed to process password reset request", error);
    }
  },

  async getProfileForActivation({ userId, email }) {
    const adminDb = getAdminDbOrThrow();
    const { data, error } = await adminDb
      .from(PROFILES_TABLE)
      .select("*")
      .eq("user_id", userId)
      .eq("email", email)
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to verify setup link", error);
    }

    return data;
  },

  async updateAuthUserPassword(input, maybePassword) {
    const userId =
      input && typeof input === "object" ? input.userId : input;
    const password =
      input && typeof input === "object" ? input.password : maybePassword;

    if (!userId || !password) {
      throw new AppError(
        "User ID and password are required to update the account password",
        StatusCodes.BAD_REQUEST,
      );
    }

    const adminDb = getAdminDbOrThrow();
    const { error } = await adminDb.auth.admin.updateUserById(userId, {
      password,
    });

    if (error) {
      throw toGatewayError("Failed to activate account password", error);
    }
  },

  async markProfileActivated({ userId }) {
    const adminDb = getAdminDbOrThrow();
    const { data, error } = await adminDb
      .from(PROFILES_TABLE)
      .update({
        activation_status: "active",
        invitation_token_hash: null,
        invitation_activated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select("*")
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to update account activation status", error);
    }

    return data;
  },

  async createAccountInvitationNotification({ adminUserId, email, status }) {
    if (!adminUserId) {
      return null;
    }

    const adminDb = getAdminDbOrThrow();
    const { data, error } = await adminDb
      .from("notifications")
      .insert({
        user_id: adminUserId,
        type: "account",
        title: status === "active" ? "Invitation accepted" : "Invitation email sent",
        message:
          status === "active"
            ? `${email} completed account setup.`
            : `A setup link was sent to ${email}.`,
        metadata: {
          kind: "accountInvitation",
          email,
          status,
        },
      })
      .select("*")
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to create account invitation notification", error);
    }

    return data;
  },

  async getProfileByUserId(userId, accessToken) {
    const db = getDbClient(accessToken);

    const { data, error } = await db
      .from(PROFILES_TABLE)
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      if (isMissingProfilesTable(error)) {
        return null;
      }

      throw toGatewayError("Failed to fetch user profile", error);
    }

    return data;
  },

  /**
   * Checks the banned_users table directly for an active ban.
   * Uses the admin Supabase client because the user's client may lack
   * permission to read banned_users.
   */
  async checkActiveBanByUserId(userId) {
    const adminDb = createAdminSupabaseClient();
    if (!adminDb) return false;

    const { data, error } = await adminDb
      .from("banned_users")
      .select("is_active")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("Failed to check banned status:", error);
      return false;
    }

    return !!data;
  },

  async getProfileByIdentifier(identifier) {
    const adminDb = createAdminSupabaseClient();
    const db = adminDb || getDbClient();
    const { data, error } = await queryProfileByIdentifier(db, identifier);

    if (error) {
      if (isMissingProfilesTable(error)) {
        return null;
      }
      throw toGatewayError("Failed to resolve login identifier", error);
    }

    return data || null;
  },

  async upsertProfileByUserId(userId, payload, accessToken) {
    const db = getDbClient(accessToken);
    const insertPayload = {
      user_id: userId,
      display_id: payload.display_id || generate6DigitId(),
      ...payload,
    };

    let { data, error } = await db
      .from(PROFILES_TABLE)
      .upsert(insertPayload, { onConflict: "user_id" })
      .select("*")
      .maybeSingle();

    if (error && error.code === "42703") {
      delete insertPayload.display_id;
      delete insertPayload.phone_verified;
      delete insertPayload.phone_verified_at;
      const retry = await db
        .from(PROFILES_TABLE)
        .upsert(insertPayload, { onConflict: "user_id" })
        .select("*")
        .maybeSingle();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      if (isMissingProfilesTable(error)) {
        return null;
      }

      throw toGatewayError("Failed to save user profile", error);
    }

    return data;
  },

  async upsertProfileByUserIdWithAdmin(userId, payload) {
    const adminDb = createAdminSupabaseClient();

    if (!adminDb) {
      return null;
    }

    const insertPayload = {
      user_id: userId,
      display_id: payload.display_id || generate6DigitId(),
      ...payload,
    };

    let { data, error } = await adminDb
      .from(PROFILES_TABLE)
      .upsert(insertPayload, { onConflict: "user_id" })
      .select("*")
      .maybeSingle();

    if (error && error.code === "42703") {
      delete insertPayload.display_id;
      delete insertPayload.phone_verified;
      delete insertPayload.phone_verified_at;
      const retry = await adminDb
        .from(PROFILES_TABLE)
        .upsert(insertPayload, { onConflict: "user_id" })
        .select("*")
        .maybeSingle();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      if (isMissingProfilesTable(error)) {
        return null;
      }

      throw toGatewayError("Failed to save user profile", error);
    }

    return data;
  },

  async changeUserPassword({ email, currentPassword, newPassword, userId }) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (signInError) {
      if (isInvalidCredentialsAuthError(signInError)) {
        throw new AppError(
          "Current password is incorrect.",
          StatusCodes.UNAUTHORIZED,
          signInError,
        );
      }

      throw toGatewayError(
        "Unable to verify your current password. Please try again.",
        signInError,
      );
    }

    const adminDb = createAdminSupabaseClient();

    if (!adminDb) {
      throw new AppError(
        "Password change is currently unavailable.",
        StatusCodes.SERVICE_UNAVAILABLE,
      );
    }

    const { error: updateError } = await adminDb.auth.admin.updateUserById(
      userId,
      { password: newPassword },
    );

    if (updateError) {
      throw toGatewayError("Failed to update password.", updateError);
    }
  },

  /**
   * Finds a guest user profile by ID if it exists and has a guest role/account_type.
   */
  async findGuestUserById(guestId) {
    if (!guestId || typeof guestId !== "string") return null;

    const adminDb = createAdminSupabaseClient();
    const db = adminDb || getDbClient();

    const { data, error } = await db
      .from(PROFILES_TABLE)
      .select("user_id, role, account_type, email, username, fname, lname")
      .eq("user_id", guestId)
      .maybeSingle();

    if (error) {
      if (isMissingProfilesTable(error)) return null;
      return null;
    }

    if (data && (data.role === "guest" || data.account_type === "guest")) {
      return data;
    }

    return null;
  },

  /**
   * Ensures a guest user identity exists in Supabase auth.users and profiles.
   * If maybeGuestId is provided and already exists in the database, reuses it
   * to avoid creating duplicate guest accounts.
   */
  async ensureGuestUser(maybeGuestId = null) {
    const validUuid = isUuid(maybeGuestId) ? maybeGuestId : null;

    if (validUuid) {
      const existing = await this.findGuestUserById(validUuid);
      if (existing) {
        return {
          id: existing.user_id,
          role: "guest",
          isGuest: true,
          username: "Guest",
        };
      }
    }

    const adminDb = createAdminSupabaseClient();
    if (!adminDb) {
      // Offline fallback / mock test environment
      return {
        id: validUuid || crypto.randomUUID(),
        role: "guest",
        isGuest: true,
        username: "Guest",
      };
    }

    const guestId = validUuid || crypto.randomUUID();
    const shortId = guestId.slice(0, 8);
    const guestEmail = `guest_${shortId}_${Date.now()}@citisent.guest`;

    try {
      const { data: createdAuth, error: createError } =
        await adminDb.auth.admin.createUser({
          id: guestId,
          email: guestEmail,
          email_confirm: true,
          user_metadata: {
            role: "guest",
            is_guest: true,
            account_type: "guest",
          },
        });

      if (createError) {
        // If user already exists, fetch and return
        const existing = await this.findGuestUserById(guestId);
        if (existing) {
          return {
            id: existing.user_id,
            role: "guest",
            isGuest: true,
            username: "Guest",
          };
        }
        console.error("[Auth] Failed to create guest auth user:", createError);
        return {
          id: guestId,
          role: "guest",
          isGuest: true,
          username: "Guest",
        };
      }

      const assignedUserId = createdAuth?.user?.id || guestId;

      try {
        const guestPayload = {
          user_id: assignedUserId,
          display_id: generate6DigitId(),
          email: guestEmail,
          username: `guest_${shortId}`,
          fname: "Guest",
          lname: "User",
          role: "guest",
          account_type: "guest",
          app_role: "citizen",
          account_status: "active",
          activation_status: "active",
          city: "Sto. Tomas",
          province: "Batangas",
          country: "Philippines",
        };

        const { error: guestError } = await adminDb
          .from(PROFILES_TABLE)
          .upsert(guestPayload, { onConflict: "user_id" });

        if (guestError && (guestError.code === "42703" || guestError.message?.includes("display_id"))) {
          delete guestPayload.display_id;
          await adminDb.from(PROFILES_TABLE).upsert(guestPayload, { onConflict: "user_id" });
        }
      } catch (profileErr) {
        console.warn("[Auth] Non-fatal: failed to update guest profile:", profileErr?.message);
      }

      return {
        id: assignedUserId,
        role: "guest",
        isGuest: true,
        username: "Guest",
      };
    } catch (err) {
      console.error("[Auth] Unexpected error ensuring guest user:", err);
      return {
        id: guestId,
        role: "guest",
        isGuest: true,
        username: "Guest",
      };
    }
  },
};
