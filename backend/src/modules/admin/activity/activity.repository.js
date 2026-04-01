import { StatusCodes } from "http-status-codes";
import {
  createAdminSupabaseClient,
  createUserSupabaseClient,
  supabase,
} from "../../../config/supabase.js";
import { AppError } from "../../../shared/errors/appError.js";

const ACTIVITY_LOG_TABLE = "admin_activity_logs";

function getDb(accessToken) {
  return createAdminSupabaseClient() || createUserSupabaseClient(accessToken) || supabase;
}

function toGatewayError(message, details) {
  return new AppError(message, StatusCodes.BAD_GATEWAY, details);
}

export const activityRepository = {
  async listActivityLog({ accessToken, adminUserId, limit, offset }) {
    const db = getDb(accessToken);
    const normalizedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 100;
    const normalizedOffset = Number.isFinite(Number(offset)) ? Number(offset) : 0;

    const { data, error, count } = await db
      .from(ACTIVITY_LOG_TABLE)
      .select("*", { count: "exact" })
      .eq("admin_user_id", adminUserId)
      .order("created_at", { ascending: false })
      .range(normalizedOffset, normalizedOffset + normalizedLimit - 1);

    if (error) {
      throw toGatewayError("Failed to fetch activity log", error);
    }

    return {
      rows: data || [],
      count: count || 0,
    };
  },

  async createActivityLogEntry({ accessToken, adminUserId, action, detail }) {
    const db = getDb(accessToken);

    const { data, error } = await db
      .from(ACTIVITY_LOG_TABLE)
      .insert({
        admin_user_id: adminUserId,
        action,
        detail,
      })
      .select("*")
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to create activity log entry", error);
    }

    return data;
  },
};
