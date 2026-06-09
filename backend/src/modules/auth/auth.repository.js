import { StatusCodes } from "http-status-codes";
import {
  createAdminSupabaseClient,
  createUserSupabaseClient,
  supabase,
} from "../../config/supabase.js";
import { AppError } from "../../shared/errors/appError.js";

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
  } catch {}

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

function toRegisterError(error) {
  const message = toErrorText(error);
  const status = Number(error?.status || error?.statusCode || 0);

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

function shouldAttemptAdminRegistrationFallback(error) {
  const message = toErrorText(error);
  const status = Number(error?.status || error?.statusCode || 0);

  const isClearlyClientInputError =
    status === StatusCodes.BAD_REQUEST &&
    (message.includes("invalid email") ||
      message.includes("email address") ||
      message.includes("password") ||
      message.includes("weak") ||
      message.includes("validation"));

  if (isClearlyClientInputError) {
    return false;
  }

  if (
    status === StatusCodes.TOO_MANY_REQUESTS ||
    message.includes("rate limit") ||
    message.includes("too many")
  ) {
    return false;
  }

  return (
    status >= StatusCodes.INTERNAL_SERVER_ERROR ||
    status === 0 ||
    message.includes("error sending confirmation email") ||
    message.includes("failed to send") ||
    message.includes("confirm") ||
    message.includes("smtp") ||
    message.includes("mailer") ||
    message.includes("mail") ||
    message.includes("email provider") ||
    message.includes("database error saving new user") ||
    message.includes("unexpected_failure") ||
    message.includes("signups not allowed") ||
    message.includes("signup disabled")
  );
}

async function registerWithAdminFallback({ email, password, userMetadata }) {
  const adminDb = createAdminSupabaseClient();
  if (!adminDb) {
    return null;
  }

  const { data, error } = await adminDb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: userMetadata,
  });

  if (error) {
    return { error, data: null };
  }

  const createdUser = data?.user || null;

  if (!createdUser) {
    return {
      error: new Error("Admin registration did not return a user record."),
      data: null,
    };
  }

  const signInResult = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInResult.error) {
    return {
      error: null,
      data: {
        user: createdUser,
        session: null,
      },
    };
  }

  return {
    error: null,
    data: {
      user: signInResult.data?.user || createdUser,
      session: signInResult.data?.session || null,
    },
  };
}

async function queryProfileByIdentifier(db, identifier) {
  const { data, error } = await db
    .from(PROFILES_TABLE)
    .select("user_id, email, username, phone_number")
    .or(
      `email.eq.${identifier},username.eq.${identifier},phone_number.eq.${identifier}`,
    )
    .limit(1)
    .maybeSingle();

  if (error || data) {
    return { data, error };
  }

  const fallback = await db
    .from(PROFILES_TABLE)
    .select("user_id, email, username, phone_number")
    .or(`email.ilike.${identifier},username.ilike.${identifier}`)
    .limit(1)
    .maybeSingle();

  return fallback;
}

async function queryProfileByEmail(db, email) {
  const { data, error } = await db
    .from(PROFILES_TABLE)
    .select("user_id, email, fname, lname")
    .eq("email", email)
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
  let page = 1;

  while (true) {
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

    const { data, error } = await queryProfileByEmail(
      getDbClient(),
      normalizedEmail,
    );

    const adminDb = createAdminSupabaseClient();

    if (!error) {
      if (data || !adminDb) {
        return data;
      }

      const { data: adminData, error: adminError } = await queryProfileByEmail(
        adminDb,
        normalizedEmail,
      );

      if (adminError) {
        if (isMissingProfilesTable(adminError)) {
          return null;
        }
        throw toGatewayError("Failed to fetch profile by email", adminError);
      }

      return adminData;
    }

    if (isMissingProfilesTable(error)) {
      return null;
    }

    if (!isAccessDenied(error)) {
      throw toGatewayError("Failed to fetch profile by email", error);
    }

    if (!adminDb) {
      return null;
    }

    const { data: adminData, error: adminError } = await queryProfileByEmail(
      adminDb,
      normalizedEmail,
    );

    if (adminError) {
      if (isMissingProfilesTable(adminError)) {
        return null;
      }
      throw toGatewayError("Failed to fetch profile by email", adminError);
    }

    return adminData;
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

  async registerWithEmailPassword({ email, password, userMetadata }) {
    const signUp = () =>
      supabase.auth.signUp({
        email,
        password,
        options: {
          data: userMetadata,
        },
      });

    let { data, error } = await signUp();

    console.error("DEBUG SIGNUP ERROR:", error);

    if (!error) {
      return data;
    }

    if (isDuplicateAuthError(error)) {
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

    if (shouldAttemptAdminRegistrationFallback(error)) {
      const fallbackResult = await registerWithAdminFallback({
        email,
        password,
        userMetadata,
      });

      if (fallbackResult && !fallbackResult.error) {
        return fallbackResult.data;
      }

      if (fallbackResult?.error) {
        error = fallbackResult.error;
      }
    }

    console.error("DEBUG REGISTER ERROR:", error);
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
          "Invalid credentials",
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
    const db = getDbClient();
    const { data, error } = await queryProfileByIdentifier(db, identifier);

    const adminDb = createAdminSupabaseClient();

    if (!error) {
      if (data || !adminDb) {
        return data;
      }

      const { data: adminData, error: adminError } =
        await queryProfileByIdentifier(adminDb, identifier);

      if (adminError) {
        if (isMissingProfilesTable(adminError)) {
          return null;
        }

        throw toGatewayError("Failed to resolve login identifier", adminError);
      }

      return adminData;
    }

    if (isMissingProfilesTable(error)) {
      return null;
    }

    if (!isAccessDenied(error)) {
      throw toGatewayError("Failed to resolve login identifier", error);
    }

    if (!adminDb) {
      return null;
    }

    const { data: adminData, error: adminError } =
      await queryProfileByIdentifier(adminDb, identifier);

    if (adminError) {
      if (isMissingProfilesTable(adminError)) {
        return null;
      }

      throw toGatewayError("Failed to resolve login identifier", adminError);
    }

    return adminData;
  },

  async upsertProfileByUserId(userId, payload, accessToken) {
    const db = getDbClient(accessToken);

    const { data, error } = await db
      .from(PROFILES_TABLE)
      .upsert(
        {
          user_id: userId,
          ...payload,
        },
        { onConflict: "user_id" },
      )
      .select("*")
      .maybeSingle();

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

    const { data, error } = await adminDb
      .from(PROFILES_TABLE)
      .upsert(
        {
          user_id: userId,
          ...payload,
        },
        { onConflict: "user_id" },
      )
      .select("*")
      .maybeSingle();

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
};
