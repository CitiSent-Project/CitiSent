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
    const db = getDbClient(accessToken);
    const adminDb = createAdminSupabaseClient();

    if (payload.email && adminDb) {
      const { error: authError } = await adminDb.auth.admin.updateUserById(
        userId,
        {
          email: payload.email,
          user_metadata: {
            ...(payload.full_name
              ? { fullName: payload.full_name, name: payload.full_name }
              : {}),
            ...(payload.username ? { username: payload.username } : {}),
            ...(payload.phone_number
              ? {
                  phoneNumber: payload.phone_number,
                  phone_number: payload.phone_number,
                  phone: payload.phone_number,
                }
              : {}),
          },
        },
      );
      if (authError) {
        if (isDuplicateProfileError(authError)) {
          throw toConflictError(
            "Email address is already in use by another account.",
            authError,
          );
        }
        throw toGatewayError("Failed to update user auth details", authError);
      }
    }

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
      if (isDuplicateProfileError(error)) {
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

      throw toGatewayError("Failed to update user profile", error);
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
