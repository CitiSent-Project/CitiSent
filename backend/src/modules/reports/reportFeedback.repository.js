import { StatusCodes } from "http-status-codes";
import {
  createAdminSupabaseClient,
  createUserSupabaseClient,
  supabase,
} from "../../config/supabase.js";
import { AppError } from "../../shared/errors/appError.js";

const FEEDBACK_TABLE = "report_feedback";
const COMMENTS_FALLBACK_TABLE = "report_comments";
const FEEDBACK_MARKER_TYPE = "resident_feedback";

function isMissingFeedbackTableError(error) {
  if (!error) return false;
  const code = String(error.code || "").trim();
  const message = String(error.message || "").toLowerCase();
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    (message.includes("report_feedback") &&
      (message.includes("does not exist") ||
        message.includes("schema cache") ||
        message.includes("could not find")))
  );
}

function parseCommentFallbackRow(row) {
  if (!row || row.is_internal) {
    return null;
  }

  const rawBody = String(row.body || "").trim();
  if (!rawBody.startsWith("{")) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawBody);
    if (parsed?.__type !== FEEDBACK_MARKER_TYPE) {
      return null;
    }

    const numericRating = Number(parsed.rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return null;
    }

    return {
      id: row.id,
      report_id: row.report_id,
      user_id: row.author_user_id,
      rating: numericRating,
      is_satisfied:
        typeof parsed.isSatisfied === "boolean" ? parsed.isSatisfied : null,
      comment: typeof parsed.comment === "string" ? parsed.comment : "",
      created_at: row.created_at,
      updated_at: row.updated_at || row.created_at,
    };
  } catch {
    return null;
  }
}

export function normalizeFeedbackRow(row) {
  if (!row) return null;

  const rating = Number(row.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return null;
  }

  return {
    id: row.id,
    reportId: row.report_id || row.reportId,
    userId: row.user_id || row.userId || row.author_user_id || null,
    rating: Math.round(rating),
    isSatisfied:
      typeof row.is_satisfied === "boolean"
        ? row.is_satisfied
        : typeof row.isSatisfied === "boolean"
          ? row.isSatisfied
          : null,
    comment: String(row.comment ?? "").trim(),
    createdAt: row.created_at || row.createdAt || null,
    updatedAt: row.updated_at || row.updatedAt || row.created_at || row.createdAt || null,
  };
}

export const reportFeedbackRepository = {
  getClient(accessToken) {
    const adminClient = createAdminSupabaseClient();
    if (adminClient) {
      return adminClient;
    }

    if (accessToken) {
      return createUserSupabaseClient(accessToken);
    }

    return supabase;
  },

  async getByReportId(reportId, accessToken) {
    const normalizedReportId = String(reportId || "").trim();
    if (!normalizedReportId) {
      return null;
    }

    const db = this.getClient(accessToken);

    const { data, error } = await db
      .from(FEEDBACK_TABLE)
      .select("id, report_id, user_id, rating, is_satisfied, comment, created_at, updated_at")
      .eq("report_id", normalizedReportId)
      .maybeSingle();

    if (!error) {
      return normalizeFeedbackRow(data);
    }

    if (!isMissingFeedbackTableError(error)) {
      throw new AppError(
        `Failed to fetch report feedback: ${error.message}`,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }

    // Fallback: read structured feedback from public.report_comments
    const { data: commentRows, error: commentError } = await db
      .from(COMMENTS_FALLBACK_TABLE)
      .select("id, report_id, author_user_id, body, is_internal, created_at, updated_at")
      .eq("report_id", normalizedReportId)
      .eq("is_internal", false)
      .order("created_at", { ascending: true });

    if (commentError) {
      throw new AppError(
        `Failed to fetch report feedback: ${commentError.message}`,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }

    for (const row of commentRows || []) {
      const parsed = parseCommentFallbackRow(row);
      if (parsed) {
        return normalizeFeedbackRow(parsed);
      }
    }

    return null;
  },

  async getByReportIds(reportIds = [], accessToken) {
    const uniqueReportIds = Array.from(
      new Set(
        (Array.isArray(reportIds) ? reportIds : [])
          .map((id) => String(id || "").trim())
          .filter(Boolean),
      ),
    );

    const feedbackByReportId = new Map();
    if (uniqueReportIds.length === 0) {
      return feedbackByReportId;
    }

    const db = this.getClient(accessToken);

    const { data, error } = await db
      .from(FEEDBACK_TABLE)
      .select("id, report_id, user_id, rating, is_satisfied, comment, created_at, updated_at")
      .in("report_id", uniqueReportIds);

    if (!error) {
      for (const row of data || []) {
        const normalized = normalizeFeedbackRow(row);
        if (normalized && normalized.reportId) {
          feedbackByReportId.set(String(normalized.reportId), normalized);
        }
      }
      return feedbackByReportId;
    }

    if (!isMissingFeedbackTableError(error)) {
      return feedbackByReportId;
    }

    // Fallback: query public.report_comments for these report IDs
    const { data: commentRows, error: commentError } = await db
      .from(COMMENTS_FALLBACK_TABLE)
      .select("id, report_id, author_user_id, body, is_internal, created_at, updated_at")
      .in("report_id", uniqueReportIds)
      .eq("is_internal", false)
      .order("created_at", { ascending: true });

    if (commentError) {
      return feedbackByReportId;
    }

    for (const row of commentRows || []) {
      const parsed = parseCommentFallbackRow(row);
      if (parsed && parsed.report_id && !feedbackByReportId.has(String(parsed.report_id))) {
        feedbackByReportId.set(String(parsed.report_id), normalizeFeedbackRow(parsed));
      }
    }

    return feedbackByReportId;
  },

  async listAllFeedback(accessToken) {
    const db = this.getClient(accessToken);

    const { data, error } = await db
      .from(FEEDBACK_TABLE)
      .select("id, report_id, user_id, rating, is_satisfied, comment, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (!error) {
      return (data || []).map(normalizeFeedbackRow).filter(Boolean);
    }

    if (!isMissingFeedbackTableError(error)) {
      throw new AppError(
        `Failed to list report feedback: ${error.message}`,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }

    const { data: commentRows, error: commentError } = await db
      .from(COMMENTS_FALLBACK_TABLE)
      .select("id, report_id, author_user_id, body, is_internal, created_at, updated_at")
      .eq("is_internal", false)
      .order("created_at", { ascending: false });

    if (commentError) {
      throw new AppError(
        `Failed to list report feedback: ${commentError.message}`,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }

    const seenReports = new Set();
    const results = [];

    for (const row of commentRows || []) {
      const parsed = parseCommentFallbackRow(row);
      if (parsed && !seenReports.has(String(parsed.report_id))) {
        seenReports.add(String(parsed.report_id));
        const normalized = normalizeFeedbackRow(parsed);
        if (normalized) {
          results.push(normalized);
        }
      }
    }

    return results;
  },

  async create({ reportId, userId, rating, isSatisfied = null, comment = "" }, accessToken) {
    const normalizedReportId = String(reportId || "").trim();
    const normalizedUserId = String(userId || "").trim();
    const normalizedRating = Number(rating);
    const normalizedComment = String(comment ?? "").trim();
    const normalizedSatisfied =
      typeof isSatisfied === "boolean" ? isSatisfied : null;

    const existing = await this.getByReportId(normalizedReportId, accessToken);
    if (existing) {
      throw new AppError(
        "Feedback has already been submitted for this report.",
        StatusCodes.CONFLICT,
      );
    }

    const db = this.getClient(accessToken);

    const { data, error } = await db
      .from(FEEDBACK_TABLE)
      .insert({
        report_id: normalizedReportId,
        user_id: normalizedUserId,
        rating: normalizedRating,
        is_satisfied: normalizedSatisfied,
        comment: normalizedComment || null,
      })
      .select("id, report_id, user_id, rating, is_satisfied, comment, created_at, updated_at")
      .single();

    if (!error) {
      return normalizeFeedbackRow(data);
    }

    // Postgres unique constraint violation (23505)
    if (String(error.code || "") === "23505") {
      throw new AppError(
        "Feedback has already been submitted for this report.",
        StatusCodes.CONFLICT,
      );
    }

    if (!isMissingFeedbackTableError(error)) {
      throw new AppError(
        `Failed to submit report feedback: ${error.message}`,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }

    // Fallback: persist into public.report_comments
    const serializedBody = JSON.stringify({
      __type: FEEDBACK_MARKER_TYPE,
      rating: normalizedRating,
      isSatisfied: normalizedSatisfied,
      comment: normalizedComment,
    });

    const { data: insertedComment, error: commentError } = await db
      .from(COMMENTS_FALLBACK_TABLE)
      .insert({
        report_id: normalizedReportId,
        author_user_id: normalizedUserId,
        body: serializedBody,
        is_internal: false,
      })
      .select("id, report_id, author_user_id, body, is_internal, created_at, updated_at")
      .single();

    if (commentError) {
      throw new AppError(
        `Failed to submit report feedback: ${commentError.message}`,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }

    return normalizeFeedbackRow(parseCommentFallbackRow(insertedComment));
  },
};
