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

function isMissingProfilesTable(error) {
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "").toUpperCase();

  return (
    code === "42P01" ||
    message.includes("relation") ||
    message.includes("profiles")
  );
}

function isDuplicateProfileError(error) {
  const code = String(error?.code || "").toUpperCase();
  const message = String(error?.message || "").toLowerCase();

  return (
    code === "23505" ||
    message.includes("duplicate key") ||
    message.includes("unique constraint")
  );
}

function toGatewayError(message, details) {
  return new AppError(message, StatusCodes.BAD_GATEWAY, details);
}

function toConflictError(message, details) {
  return new AppError(message, StatusCodes.CONFLICT, details);
}

function buildAuthUserMetadata(payload = {}) {
  const userMetadata = {
    ...(payload.fname !== undefined ? { fname: payload.fname } : {}),
    ...(payload.mname !== undefined ? { mname: payload.mname } : {}),
    ...(payload.lname !== undefined ? { lname: payload.lname } : {}),
    ...(payload.username ? { username: payload.username } : {}),
    ...(payload.phone_number
      ? {
          phoneNumber: payload.phone_number,
          phone_number: payload.phone_number,
          phone: payload.phone_number,
        }
      : {}),
  };

  return Object.fromEntries(
    Object.entries(userMetadata).filter(([_, value]) => value != null),
  );
}

/**
 * Checks whether a given field value is already used by a DIFFERENT user's profile.
 * Returns the conflicting row's user_id, or null if no conflict exists.
 * Uses the service-role client to bypass RLS so the check is always authoritative.
 */
async function findConflictingProfile(field, value, excludeUserId) {
  // Prefer the service-role (admin) client so RLS never hides existing rows.
  const adminDb = createAdminSupabaseClient();
  const db = adminDb || supabase;

  const { data, error } = await db
    .from(PROFILES_TABLE)
    .select("user_id")
    .eq(field, value)
    .neq("user_id", excludeUserId)
    .maybeSingle();

  if (error) {
    // If we can't query (e.g. table missing), don't block the update — the DB
    // constraint (if present) will still catch true duplicates.
    if (isMissingProfilesTable(error)) return null;
    // For any other query error, surface it so we don't silently skip the check.
    throw toGatewayError(`Failed to check ${field} uniqueness`, error);
  }

  return data ?? null;
}

export const usersRepository = {
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

  async upsertProfileByUserId(userId, payload, accessToken) {
    // ── Uniqueness pre-checks ─────────────────────────────────────────────────
    // These run BEFORE any write so we can return a clear 409 error instead of
    // relying solely on database UNIQUE constraints (which may not exist).
    // Each check explicitly excludes the current user so they can keep their
    // own existing username / email / phone without triggering a conflict.

    if (payload.username) {
      const conflict = await findConflictingProfile("username", payload.username, userId);
      if (conflict) {
        throw toConflictError(
          "This username is already in use. Please choose a different username.",
        );
      }
    }

    if (payload.phone_number) {
      const conflict = await findConflictingProfile("phone_number", payload.phone_number, userId);
      if (conflict) {
        throw toConflictError(
          "This phone number is already associated with another account.",
        );
      }
    }

    if (payload.email) {
      // Email is stored both in Supabase auth AND in the profiles table.
      // Check the profiles table first (fastest, no admin API call needed).
      const conflict = await findConflictingProfile("email", payload.email, userId);
      if (conflict) {
        throw toConflictError(
          "This email address is already registered to another account.",
        );
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const db = getDbClient(accessToken);
    const adminDb = createAdminSupabaseClient();

    if (adminDb) {
      const userMetadata = buildAuthUserMetadata(payload);
      const shouldUpdateAuthRecord =
        payload.email !== undefined || Object.keys(userMetadata).length > 0;

      if (shouldUpdateAuthRecord) {
        const { error: authError } = await adminDb.auth.admin.updateUserById(
          userId,
          {
            ...(payload.email ? { email: payload.email } : {}),
            ...(Object.keys(userMetadata).length > 0 ? { user_metadata: userMetadata } : {}),
          },
        );

        if (authError) {
          if (isDuplicateProfileError(authError)) {
            throw toConflictError(
              "This email address is already registered to another account.",
              authError,
            );
          }

          throw toGatewayError("Failed to update user auth details", authError);
        }
      }
    }

    const { data, error } = await adminDb
      .from(PROFILES_TABLE)
      .update(payload)
      .eq("user_id", userId)
      .select("*")
      .maybeSingle();

    if (error) {
      if (isDuplicateProfileError(error)) {
        // Fallback: DB constraint fired despite our pre-checks (race condition).
        const msg = String(error.message || "").toLowerCase();
        let field = "A field";
        if (msg.includes("username")) field = "Username";
        else if (msg.includes("phone")) field = "Phone number";
        else if (msg.includes("email")) field = "Email address";

        throw toConflictError(
          `${field} is already in use by another account.`,
          error,
        );
      }

      console.error("[DEBUG] upsertProfileByUserId error:", error);
      throw toGatewayError(`Failed to update user profile: ${error.message || 'Database error'}`, error);
    }

    return data;
  },

  async deleteAccountByUserId(userId) {
    const adminDb = createAdminSupabaseClient();

    if (!adminDb) {
      throw new AppError(
        "Account deletion is currently unavailable",
        StatusCodes.SERVICE_UNAVAILABLE,
      );
    }

    const { error: authError } = await adminDb.auth.admin.deleteUser(
      userId,
      false,
    );

    if (authError) {
      throw toGatewayError("Failed to delete account", authError);
    }
  },
};
