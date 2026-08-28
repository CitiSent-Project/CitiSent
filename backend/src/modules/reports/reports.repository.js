import { StatusCodes } from "http-status-codes";
import { createUserSupabaseClient, supabase } from "../../config/supabase.js";
import { AppError } from "../../shared/errors/appError.js";

const TABLE_NAME = "reports";

function getDbClient(accessToken) {
  if (!accessToken) {
    return supabase;
  }

  return createUserSupabaseClient(accessToken);
}

const REPORT_SELECT_COLUMNS = "id,report_number,issue_type,description,location,latitude,longitude,status,sentiment_label,emotion_level,ai_summary,attachment_url,created_at,updated_at,user_id";

export const reportsRepository = {
  async list({ userId, limit, offset, status, accessToken }) {
    const db = getDbClient(accessToken);

    let query = db
      .from(TABLE_NAME)
      .select(REPORT_SELECT_COLUMNS, { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new AppError(
        "Failed to fetch reports",
        StatusCodes.BAD_GATEWAY,
        error,
      );
    }

    return {
      rows: data ?? [],
      count: count ?? 0,
    };
  },

  async getCountsByStatus({ userId, accessToken }) {
    const db = getDbClient(accessToken);

    const { data, error } = await db
      .from(TABLE_NAME)
      .select("status")
      .eq("user_id", userId);

    if (error) {
      throw new AppError(
        "Failed to fetch report counts",
        StatusCodes.BAD_GATEWAY,
        error,
      );
    }

    const counts = {
      pending: 0,
      in_review: 0,
      resolved: 0,
      rejected: 0,
    };

    for (const row of data || []) {
      const status = String(row.status || "").toLowerCase();
      if (counts[status] !== undefined) {
        counts[status] += 1;
      }
    }

    return counts;
  },

  async getUnreadSummary({ userId, accessToken }) {
    const db = getDbClient(accessToken);

    // 1. Fetch report IDs and statuses for this user
    const { data: reports, error: reportsError } = await db
      .from(TABLE_NAME)
      .select("id, status")
      .eq("user_id", userId);

    if (reportsError) {
      throw new AppError(
        "Failed to fetch report unread summary",
        StatusCodes.BAD_GATEWAY,
        reportsError,
      );
    }

    const statusByReport = {};
    const reportIds = [];
    for (const r of reports || []) {
      const repId = String(r.id);
      statusByReport[repId] = r.status || "pending";
      reportIds.push(r.id);
    }

    if (!reportIds.length) {
      return {
        hasUnread: false,
        unreadByReport: {},
        statusByReport: {},
      };
    }

    // 2. Fetch messages in user's reports where sender is not the user
    const { data: messages, error: messagesError } = await db
      .from("report_messages")
      .select("id, report_id")
      .in("report_id", reportIds)
      .neq("sender_id", userId);

    if (messagesError) {
      throw new AppError(
        "Failed to fetch messages for unread summary",
        StatusCodes.BAD_GATEWAY,
        messagesError,
      );
    }

    const messageRows = messages || [];
    if (!messageRows.length) {
      return {
        hasUnread: false,
        unreadByReport: {},
        statusByReport,
      };
    }

    // 3. Fetch reads for these message IDs by this user
    const messageIds = messageRows.map((m) => m.id);
    const { data: reads, error: readsError } = await db
      .from("report_message_reads")
      .select("message_id")
      .eq("user_id", userId)
      .eq("is_read", true)
      .in("message_id", messageIds);

    if (readsError) {
      throw new AppError(
        "Failed to fetch read state for unread summary",
        StatusCodes.BAD_GATEWAY,
        readsError,
      );
    }

    const readSet = new Set((reads || []).map((r) => String(r.message_id)));
    const unreadByReport = {};
    let hasUnread = false;

    for (const msg of messageRows) {
      if (!readSet.has(String(msg.id))) {
        unreadByReport[String(msg.report_id)] = true;
        hasUnread = true;
      }
    }

    return {
      hasUnread,
      unreadByReport,
      statusByReport,
    };
  },

  async create(payload, accessToken) {
    const db = getDbClient(accessToken);

    const { data, error } = await db
      .from(TABLE_NAME)
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      throw new AppError(
        "Failed to create report",
        StatusCodes.BAD_GATEWAY,
        error,
      );
    }

    return data;
  },

  async getById({ userId, reportId, accessToken }) {
    const db = getDbClient(accessToken);

    const { data, error } = await db
      .from(TABLE_NAME)
      .select("*")
      .eq("id", reportId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new AppError(
        "Failed to fetch report",
        StatusCodes.BAD_GATEWAY,
        error,
      );
    }

    return data;
  },

  async updateById({ userId, reportId, payload, accessToken }) {
    const db = getDbClient(accessToken);

    const { data, error } = await db
      .from(TABLE_NAME)
      .update(payload)
      .eq("id", reportId)
      .eq("user_id", userId)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new AppError(
        "Failed to update report",
        StatusCodes.BAD_GATEWAY,
        error,
      );
    }

    return data;
  },

  async deleteById({ userId, reportId, accessToken }) {
    const db = getDbClient(accessToken);

    const { data, error } = await db
      .from(TABLE_NAME)
      .delete()
      .eq("id", reportId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new AppError(
        "Failed to delete report",
        StatusCodes.BAD_GATEWAY,
        error,
      );
    }

    return data;
  },
};
