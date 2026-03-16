import { StatusCodes } from "http-status-codes";
import { supabase, supabaseAdmin } from "../../config/supabase.js";
import { AppError } from "../../shared/errors/appError.js";

const TABLE_NAME = "reports";

function getDbClient() {
  return supabaseAdmin ?? supabase;
}

export const reportsRepository = {
  async list({ userId, limit, offset, status }) {
    const db = getDbClient();

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

  async create(payload) {
    const db = getDbClient();

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
};
