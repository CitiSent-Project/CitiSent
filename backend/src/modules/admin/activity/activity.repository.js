import { StatusCodes } from "http-status-codes";
import {
  createAdminSupabaseClient,
  createUserSupabaseClient,
  supabase,
} from "../../../config/supabase.js";
import { AppError } from "../../../shared/errors/appError.js";
import { logger } from "../../../config/logger.js";

const ACTIVITY_LOG_TABLE = "admin_activity_logs";

function getDb(accessToken) {
  return activityRepository._db || createAdminSupabaseClient() || createUserSupabaseClient(accessToken) || supabase;
}

function toGatewayError(message, details) {
  return new AppError(message, StatusCodes.BAD_GATEWAY, details);
}

export const activityRepository = {
  _db: null,
  _setDb(db) {
    this._db = db;
  },

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
        detail: detail || "",
      })
      .select("*")
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to create activity log entry", error);
    }

    return data;
  },

  recordActivityBestEffort({ accessToken, adminUserId, action, detail }) {
    const normalizedUserId = String(adminUserId || "").trim();
    const normalizedAction = String(action || "").trim();

    if (!normalizedUserId || !normalizedAction) {
      return;
    }

    this.createActivityLogEntry({
      accessToken,
      adminUserId: normalizedUserId,
      action: normalizedAction.slice(0, 160),
      detail: String(detail || "").slice(0, 1000),
    }).catch((error) => {
      logger.warn("Failed to record admin activity log", {
        adminUserId: normalizedUserId,
        action: normalizedAction,
        error: error?.message || String(error),
      });
    });
  },
};

