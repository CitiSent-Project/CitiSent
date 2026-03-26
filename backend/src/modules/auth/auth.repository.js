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

function toGatewayError(message, details) {
  return new AppError(message, StatusCodes.BAD_GATEWAY, details);
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

  return { data, error };
}

async function queryProfileByEmail(db, email) {
  const { data, error } = await db
    .from(PROFILES_TABLE)
    .select("user_id")
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

      throw new AppError(
        "Invalid credentials",
        StatusCodes.UNAUTHORIZED,
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
};
