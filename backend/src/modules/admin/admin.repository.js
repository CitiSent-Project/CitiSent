import { StatusCodes } from "http-status-codes";
import {
  createAdminSupabaseClient,
  createUserSupabaseClient,
  supabase,
} from "../../config/supabase.js";
import { AppError } from "../../shared/errors/appError.js";
import { USER_ROLES, isSuperadmin } from "../../shared/auth/roleAccess.js";
import { buildDepartmentCandidates } from "../../shared/data/departments.js";

const PROFILES_TABLE = "profiles";
const REPORTS_TABLE = "reports";
const TRANSFER_REQUESTS_TABLE = "transfer_requests";

function getDb(accessToken) {
  return createAdminSupabaseClient() || createUserSupabaseClient(accessToken) || supabase;
}

function toGatewayError(message, details) {
  return new AppError(message, StatusCodes.BAD_GATEWAY, details);
}

async function loadReporterProfiles(db, rows = []) {
  const reporterIds = Array.from(
    new Set(rows.map((row) => row.user_id).filter(Boolean)),
  );

  if (!reporterIds.length) {
    return {};
  }

  const { data, error } = await db
    .from(PROFILES_TABLE)
    .select("user_id, email, username, full_name")
    .in("user_id", reporterIds);

  if (error) {
    throw toGatewayError("Failed to fetch report owners", error);
  }

  return (data || []).reduce((accumulator, profile) => {
    accumulator[profile.user_id] = profile;
    return accumulator;
  }, {});
}

function applyDepartmentScope(query, actor) {
  if (isSuperadmin(actor?.role)) {
    return query;
  }

  const candidates = buildDepartmentCandidates({
    departmentId: actor?.departmentId,
    departmentLabel: actor?.departmentLabel,
  });

  if (candidates.length === 0) {
    return query.eq("id", "__no_access__");
  }

  return query.in("issue_type", candidates);
}

export const adminRepository = {
  async listReports({ actor, accessToken, limit, offset, status }) {
    const db = getDb(accessToken);

    let query = db
      .from(REPORTS_TABLE)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    query = applyDepartmentScope(query, actor);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query;

    if (error) {
      throw toGatewayError("Failed to fetch admin reports", error);
    }

    const reporterProfilesByUserId = await loadReporterProfiles(db, data || []);

    return {
      rows: data || [],
      count: count || 0,
      reporterProfilesByUserId,
    };
  },

  async getReportById({ actor, accessToken, reportId }) {
    const db = getDb(accessToken);

    let query = db.from(REPORTS_TABLE).select("*").eq("id", reportId);
    query = applyDepartmentScope(query, actor);

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw toGatewayError("Failed to fetch admin report", error);
    }

    if (!data) {
      return null;
    }

    const reporterProfilesByUserId = await loadReporterProfiles(db, [data]);

    return {
      row: data,
      reporterProfile: reporterProfilesByUserId[data.user_id] || null,
    };
  },

  async updateReportById({ actor, accessToken, reportId, payload }) {
    const db = getDb(accessToken);

    let query = db.from(REPORTS_TABLE).update(payload).eq("id", reportId);
    query = applyDepartmentScope(query, actor);

    const { data, error } = await query.select("*").maybeSingle();

    if (error) {
      throw toGatewayError("Failed to update admin report", error);
    }

    if (!data) {
      return null;
    }

    const reporterProfilesByUserId = await loadReporterProfiles(db, [data]);

    return {
      row: data,
      reporterProfile: reporterProfilesByUserId[data.user_id] || null,
    };
  },

  async listOfficeAdmins({ accessToken }) {
    const db = getDb(accessToken);
    const { data, error } = await db
      .from(PROFILES_TABLE)
      .select("*")
      .eq("account_type", "admin")
      .eq("role", USER_ROLES.OFFICE_ADMIN)
      .order("full_name", { ascending: true });

    if (error) {
      throw toGatewayError("Failed to fetch office admins", error);
    }

    return data || [];
  },

  async getOfficeAdminByUserId({ accessToken, adminUserId }) {
    const db = getDb(accessToken);
    const { data, error } = await db
      .from(PROFILES_TABLE)
      .select("*")
      .eq("user_id", adminUserId)
      .eq("account_type", "admin")
      .eq("role", USER_ROLES.OFFICE_ADMIN)
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to fetch office admin", error);
    }

    return data;
  },

  async updateOfficeAdminDepartment({
    accessToken,
    adminUserId,
    departmentId,
    departmentLabel,
  }) {
    const db = getDb(accessToken);
    const { data, error } = await db
      .from(PROFILES_TABLE)
      .update({
        department_id: departmentId,
        department_label: departmentLabel,
      })
      .eq("user_id", adminUserId)
      .eq("role", USER_ROLES.OFFICE_ADMIN)
      .select("*")
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to update office admin department", error);
    }

    return data;
  },

  async listTransferRequests({ actor, accessToken }) {
    const db = getDb(accessToken);

    let query = db
      .from(TRANSFER_REQUESTS_TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (!isSuperadmin(actor?.role)) {
      query = query.eq("admin_user_id", actor?.id);
    }

    const { data, error } = await query;

    if (error) {
      throw toGatewayError("Failed to fetch transfer requests", error);
    }

    return data || [];
  },

  async getPendingTransferRequestForAdmin({ accessToken, adminUserId }) {
    const db = getDb(accessToken);
    const { data, error } = await db
      .from(TRANSFER_REQUESTS_TABLE)
      .select("*")
      .eq("admin_user_id", adminUserId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to fetch pending transfer request", error);
    }

    return data;
  },

  async createTransferRequest({ accessToken, payload }) {
    const db = getDb(accessToken);
    const { data, error } = await db
      .from(TRANSFER_REQUESTS_TABLE)
      .insert(payload)
      .select("*")
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to create transfer request", error);
    }

    return data;
  },

  async getTransferRequestById({ accessToken, requestId }) {
    const db = getDb(accessToken);
    const { data, error } = await db
      .from(TRANSFER_REQUESTS_TABLE)
      .select("*")
      .eq("id", requestId)
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to fetch transfer request", error);
    }

    return data;
  },

  async updateTransferRequestReview({
    accessToken,
    requestId,
    status,
    reviewerId,
    reviewerName,
    reviewNotes,
  }) {
    const db = getDb(accessToken);
    const { data, error } = await db
      .from(TRANSFER_REQUESTS_TABLE)
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by_user_id: reviewerId,
        reviewed_by_name: reviewerName,
        review_notes: reviewNotes || null,
      })
      .eq("id", requestId)
      .select("*")
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to review transfer request", error);
    }

    return data;
  },
};
