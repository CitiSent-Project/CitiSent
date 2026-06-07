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

export const reportsRepository = {
  async list({ userId, limit, offset, status, accessToken }) {
    const db = getDbClient(accessToken);

    let query = db
      .from(TABLE_NAME)
      .select("*", { count: "exact" })
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
    const statuses = ["pending", "in_review", "resolved", "rejected"];
    
    const countPromises = statuses.map(status => 
      db
        .from(TABLE_NAME)
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", status)
    );

    const results = await Promise.all(countPromises);
    
    return {
      pending: results[0].count || 0,
      in_review: results[1].count || 0,
      resolved: results[2].count || 0,
      rejected: results[3].count || 0,
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
