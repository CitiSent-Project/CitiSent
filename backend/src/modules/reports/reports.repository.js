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
