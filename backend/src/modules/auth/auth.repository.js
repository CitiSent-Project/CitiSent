import { StatusCodes } from "http-status-codes";
import { createUserSupabaseClient, supabase } from "../../config/supabase.js";
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

function isAccessDenied(error) {
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "").toUpperCase();

  return code === "42501" || message.includes("permission denied");
}

function toGatewayError(message, details) {
  return new AppError(message, StatusCodes.BAD_GATEWAY, details);
}

export const authRepository = {
  async registerWithEmailPassword({ email, password, userMetadata }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userMetadata,
      },
    });

    if (error) {
      throw toGatewayError("Failed to register account", error);
    }

    return data;
  },

  async loginWithEmailPassword({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
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

    const { data, error } = await db
      .from(PROFILES_TABLE)
      .select("user_id, email, username, phone_number")
      .or(
        `email.eq.${identifier},username.eq.${identifier},phone_number.eq.${identifier}`,
      )
      .limit(1)
      .maybeSingle();

    if (error) {
      if (isMissingProfilesTable(error) || isAccessDenied(error)) {
        return null;
      }

      throw toGatewayError("Failed to resolve login identifier", error);
    }

    return data;
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
};
