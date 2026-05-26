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

function resolveTargetUserId({ adminUserId, userId }) {
  const targetUserId = String(userId || adminUserId || "").trim();

  if (!targetUserId) {
    throw new AppError("Target user is required", StatusCodes.BAD_REQUEST);
  }

  return targetUserId;
}

export const notificationsRepository = {
  async listNotifications({
    accessToken,
    adminUserId,
    userId,
    limit,
    offset,
    isRead,
    reportId,
  }) {
    const db = getDb(accessToken);
    const targetUserId = resolveTargetUserId({ adminUserId, userId });
    const normalizedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 50;
    const normalizedOffset = Number.isFinite(Number(offset)) ? Number(offset) : 0;
    const normalizedReportId = String(reportId || "").trim();

    let query = db
      .from(NOTIFICATIONS_TABLE)
      .select("*", { count: "exact" })
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false })
      .range(normalizedOffset, normalizedOffset + normalizedLimit - 1);

    if (typeof isRead === "boolean") {
      query = query.eq("is_read", isRead);
    }

    if (normalizedReportId) {
      query = query.eq("report_id", normalizedReportId);
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
    userId,
    notificationId,
    isRead,
  }) {
    const db = getDb(accessToken);
    const targetUserId = resolveTargetUserId({ adminUserId, userId });

    const { data, error } = await db
      .from(NOTIFICATIONS_TABLE)
      .update({
        is_read: isRead,
        read_at: isRead ? new Date().toISOString() : null,
      })
      .eq("id", notificationId)
      .eq("user_id", targetUserId)
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
    userId,
    notificationIds,
    markAll,
    isRead,
  }) {
    const db = getDb(accessToken);
    const targetUserId = resolveTargetUserId({ adminUserId, userId });

    let query = db
      .from(NOTIFICATIONS_TABLE)
      .update({
        is_read: isRead,
        read_at: isRead ? new Date().toISOString() : null,
      })
      .eq("user_id", targetUserId);

    if (!markAll) {
      query = query.in("id", notificationIds);
    }

    const { data, error } = await query.select("*");

    if (error) {
      throw toGatewayError("Failed to update notifications", error);
    }

    return data || [];
  },

  async clearNotifications({
    accessToken,
    adminUserId,
    userId,
    notificationIds,
    clearAll,
  }) {
    const db = getDb(accessToken);
    const targetUserId = resolveTargetUserId({ adminUserId, userId });

    let query = db.from(NOTIFICATIONS_TABLE).delete().eq("user_id", targetUserId);

    if (!clearAll) {
      query = query.in("id", notificationIds);
    }

    const { data, error } = await query.select("id");

    if (error) {
      throw toGatewayError("Failed to clear notifications", error);
    }

    return data || [];
  },

  async createNotification({
    accessToken,
    userId,
    type,
    title,
    message,
    reportId,
    metadata,
  }) {
    const db = getDb(accessToken);
    const targetUserId = resolveTargetUserId({ userId });

    const { data, error } = await db
      .from(NOTIFICATIONS_TABLE)
      .insert({
        user_id: targetUserId,
        type,
        title,
        message,
        report_id: reportId || null,
        ...(metadata ? { metadata } : {}),
      })
      .select("*")
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to create notification", error);
    }

    return data;
  },
};
