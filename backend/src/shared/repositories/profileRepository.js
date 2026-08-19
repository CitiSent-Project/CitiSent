import { StatusCodes } from "http-status-codes";
import {
  createAdminSupabaseClient,
  createUserSupabaseClient,
  supabase,
} from "../../config/supabase.js";
import { AppError } from "../errors/appError.js";
import { cacheService } from "../cache/cacheService.js";

const PROFILES_TABLE = "profiles";
const PROFILE_CACHE_TTL_SECONDS = 120;

function buildProfileCacheKey(userId) {
  return `profile:user:${userId}`;
}

function getUserDb(accessToken) {
  if (!accessToken) {
    return supabase;
  }

  return createUserSupabaseClient(accessToken);
}

function getAdminDb(accessToken) {
  return createAdminSupabaseClient() || getUserDb(accessToken);
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

async function queryProfileByUserId(db, userId, columns = "*") {
  return db
    .from(PROFILES_TABLE)
    .select(columns)
    .eq("user_id", userId)
    .maybeSingle();
}

async function queryProfileByIdentifier(db, identifier) {
  return db
    .from(PROFILES_TABLE)
    .select("*")
    .or(
      `email.eq.${identifier},username.eq.${identifier},phone_number.eq.${identifier}`,
    )
    .limit(1)
    .maybeSingle();
}

export const profileRepository = {
  async getByUserId({ userId, accessToken, columns = "*", useAdmin = false }) {
    if (!userId) return null;

    // Cache full profile queries to eliminate redundant DB calls
    const isFullSelect = columns === "*";
    const cacheKey = buildProfileCacheKey(userId);

    if (isFullSelect) {
      const cached = await cacheService.getJSON(cacheKey);
      if (cached) return cached;
    }

    const primaryDb = useAdmin ? getAdminDb(accessToken) : getUserDb(accessToken);
    const { data, error } = await queryProfileByUserId(primaryDb, userId, columns);

    if (!error) {
      if (isFullSelect && data) {
        await cacheService.setJSON(cacheKey, data, PROFILE_CACHE_TTL_SECONDS);
      }
      return data;
    }


    if (isMissingProfilesTable(error)) {
      return null;
    }

    if (!useAdmin && isAccessDenied(error)) {
      const { data: adminData, error: adminError } = await queryProfileByUserId(
        getAdminDb(accessToken),
        userId,
        columns,
      );

      if (!adminError) {
        return adminData;
      }

      if (isMissingProfilesTable(adminError)) {
        return null;
      }

      throw toGatewayError("Failed to fetch user profile", adminError);
    }

    throw toGatewayError("Failed to fetch user profile", error);
  },

  async getByIdentifier({ identifier, accessToken }) {
    const primaryDb = getUserDb(accessToken);
    const { data, error } = await queryProfileByIdentifier(primaryDb, identifier);

    if (!error) {
      if (data || !createAdminSupabaseClient()) {
        return data;
      }

      const { data: adminData, error: adminError } = await queryProfileByIdentifier(
        getAdminDb(accessToken),
        identifier,
      );

      if (!adminError) {
        return adminData;
      }

      if (isMissingProfilesTable(adminError)) {
        return null;
      }

      throw toGatewayError("Failed to resolve login identifier", adminError);
    }

    if (isMissingProfilesTable(error)) {
      return null;
    }

    if (!isAccessDenied(error)) {
      throw toGatewayError("Failed to resolve login identifier", error);
    }

    const { data: adminData, error: adminError } = await queryProfileByIdentifier(
      getAdminDb(accessToken),
      identifier,
    );

    if (!adminError) {
      return adminData;
    }

    if (isMissingProfilesTable(adminError)) {
      return null;
    }

    throw toGatewayError("Failed to resolve login identifier", adminError);
  },

  async upsertByUserId({
    userId,
    payload,
    accessToken,
    useAdmin = false,
    columns = "*",
  }) {
    const db = useAdmin ? getAdminDb(accessToken) : getUserDb(accessToken);

    const { data, error } = await db
      .from(PROFILES_TABLE)
      .upsert(
        {
          user_id: userId,
          ...payload,
        },
        { onConflict: "user_id" },
      )
      .select(columns)
      .maybeSingle();

    if (!error) {
      if (userId) {
        await cacheService.delete(buildProfileCacheKey(userId));
      }
      return data;
    }

    if (isMissingProfilesTable(error)) {
      return null;
    }

    if (!useAdmin && isAccessDenied(error)) {
      return this.upsertByUserId({
        userId,
        payload,
        accessToken,
        useAdmin: true,
        columns,
      });
    }

    throw toGatewayError("Failed to save user profile", error);
  },
};
