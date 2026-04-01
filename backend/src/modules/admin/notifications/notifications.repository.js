import { StatusCodes } from "http-status-codes";
import {
  createAdminSupabaseClient,
  createUserSupabaseClient,
  supabase,
} from "../../../config/supabase.js";
import { AppError } from "../../../shared/errors/appError.js";

const NOTIFICATIONS_TABLE = "notifications";

function getDb(accessToken) {
  return createAdminSupabaseClient() || createUserSupabaseClient(accessToken) || supabase;
}

function toGatewayError(message, details) {
  return new AppError(message, StatusCodes.BAD_GATEWAY, details);
}

export const notificationsRepository = {
  async listNotifications({ accessToken, adminUserId, limit, offset, isRead }) {
    const db = getDb(accessToken);
    const normalizedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 50;
    const normalizedOffset = Number.isFinite(Number(offset)) ? Number(offset) : 0;

    let query = db
      .from(NOTIFICATIONS_TABLE)
      .select("*", { count: "exact" })
      .eq("user_id", adminUserId)
      .order("created_at", { ascending: false })
      .range(normalizedOffset, normalizedOffset + normalizedLimit - 1);

    if (typeof isRead === "boolean") {
      query = query.eq("is_read", isRead);
    }

    const { data, error, count } = await query;

    if (error) {
      throw toGatewayError("Failed to fetch notifications", error);
    }

    return {
      rows: data || [],
      count: count || 0,
    };
  },

  async updateNotificationReadState({
    accessToken,
    adminUserId,
    notificationId,
    isRead,
  }) {
    const db = getDb(accessToken);

    const { data, error } = await db
      .from(NOTIFICATIONS_TABLE)
      .update({
        is_read: isRead,
        read_at: isRead ? new Date().toISOString() : null,
      })
      .eq("id", notificationId)
      .eq("user_id", adminUserId)
      .select("*")
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to update notification", error);
    }

    return data;
  },

  async bulkUpdateNotificationReadState({
    accessToken,
    adminUserId,
    notificationIds,
    markAll,
    isRead,
  }) {
    const db = getDb(accessToken);

    let query = db
      .from(NOTIFICATIONS_TABLE)
      .update({
        is_read: isRead,
        read_at: isRead ? new Date().toISOString() : null,
      })
      .eq("user_id", adminUserId);

    if (!markAll) {
      query = query.in("id", notificationIds);
    }

    const { data, error } = await query.select("*");

    if (error) {
      throw toGatewayError("Failed to update notifications", error);
    }

    return data || [];
  },

  async clearNotifications({ accessToken, adminUserId, notificationIds, clearAll }) {
    const db = getDb(accessToken);

    let query = db.from(NOTIFICATIONS_TABLE).delete().eq("user_id", adminUserId);

    if (!clearAll) {
      query = query.in("id", notificationIds);
    }

    const { data, error } = await query.select("id");

    if (error) {
      throw toGatewayError("Failed to clear notifications", error);
    }

    return data || [];
  },
};
