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
const BANNED_USERS_TABLE = "banned_users";
const REPORTS_TABLE = "reports";
const TRANSFER_REQUESTS_TABLE = "transfer_requests";

function getDb(accessToken) {
  return createAdminSupabaseClient() || createUserSupabaseClient(accessToken) || supabase;
}

function toGatewayError(message, details) {
  return new AppError(message, StatusCodes.BAD_GATEWAY, details);
}

function toErrorText(error) {
  const parts = [
    error?.message,
    error?.code,
    error?.name,
    error?.details,
    error?.hint,
    error?.cause?.message,
    error?.cause?.details,
    error?.error_description,
  ]
    .filter(Boolean)
    .map((value) => String(value));

  try {
    parts.push(JSON.stringify(error));
  } catch {}

  return parts.join(" ").toLowerCase();
}

function isDuplicateAuthError(error) {
  const message = toErrorText(error);
  const code = String(error?.code || "").toUpperCase();

  return (
    code === "USER_ALREADY_EXISTS" ||
    code === "23505" ||
    message.includes("already registered") ||
    message.includes("already exists") ||
    message.includes("duplicate key") ||
    message.includes("unique constraint")
  );
}

function getAdminDb() {
  const adminDb = createAdminSupabaseClient();

  if (!adminDb) {
    throw new AppError(
      "Admin user management requires SUPABASE_SERVICE_ROLE_KEY",
      StatusCodes.SERVICE_UNAVAILABLE,
    );
  }

  return adminDb;
}

async function getActiveBansByUserIds({ db, userIds = [] }) {
  if (!userIds.length) {
    return {};
  }

  const { data, error } = await db
    .from(BANNED_USERS_TABLE)
    .select("user_id, reason, banned_at, banned_by_user_id")
    .in("user_id", userIds)
    .eq("is_active", true);

  if (error) {
    throw toGatewayError("Failed to fetch banned users", error);
  }

  return (data || []).reduce((accumulator, banEntry) => {
    accumulator[banEntry.user_id] = banEntry;
    return accumulator;
  }, {});
}

async function getActiveBanByUserId({ db, userId }) {
  const activeBansByUserId = await getActiveBansByUserIds({ db, userIds: [userId] });
  return activeBansByUserId[userId] || null;
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
    .select("user_id, email, username, fname, mname, lname")
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
  async listUsers({ accessToken, limit, offset, search, status }) {
    const db = getDb(accessToken);
    const normalizedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 50;
    const normalizedOffset = Number.isFinite(Number(offset)) ? Number(offset) : 0;
    const normalizedSearch = String(search || "").trim();

    let query = db
      .from(PROFILES_TABLE)
      .select("*")
      .eq("account_type", "citizen")
      .order("created_at", { ascending: false });

    if (normalizedSearch) {
      query = query.or(
        `email.ilike.%${normalizedSearch}%,username.ilike.%${normalizedSearch}%,fname.ilike.%${normalizedSearch}%,mname.ilike.%${normalizedSearch}%,lname.ilike.%${normalizedSearch}%,phone_number.ilike.%${normalizedSearch}%`,
      );
    }

    const { data, error } = await query;

    if (error) {
      throw toGatewayError("Failed to fetch users", error);
    }

    const allRows = data || [];
    const activeBansByUserId = await getActiveBansByUserIds({
      db,
      userIds: allRows.map((row) => row.user_id).filter(Boolean),
    });

    const filteredRows = allRows.filter((row) => {
      if (!status) {
        return true;
      }

      const isBanned = Boolean(activeBansByUserId[row.user_id]);
      return status === "banned" ? isBanned : !isBanned;
    });

    const paginatedRows = filteredRows.slice(
      normalizedOffset,
      normalizedOffset + normalizedLimit,
    );

    const paginatedBansByUserId = paginatedRows.reduce((accumulator, row) => {
      if (activeBansByUserId[row.user_id]) {
        accumulator[row.user_id] = activeBansByUserId[row.user_id];
      }
      return accumulator;
    }, {});

    return {
      rows: paginatedRows,
      count: filteredRows.length,
      activeBansByUserId: paginatedBansByUserId,
    };
  },

  async getUserById({ accessToken, userId }) {
    const db = getDb(accessToken);

    const { data, error } = await db
      .from(PROFILES_TABLE)
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to fetch user", error);
    }

    if (!data) {
      return null;
    }

    const activeBan = await getActiveBanByUserId({ db, userId });

    return {
      profile: data,
      activeBan,
    };
  },

  async createAuthUser({ email, password, userMetadata }) {
    const adminDb = getAdminDb();
    const { data, error } = await adminDb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: userMetadata,
    });

    if (error) {
      if (isDuplicateAuthError(error)) {
        throw new AppError("Email is already registered", StatusCodes.CONFLICT, error);
      }

      throw toGatewayError("Failed to create authentication account", error);
    }

    return data?.user || null;
  },

  async deleteAuthUserById({ userId }) {
    const adminDb = getAdminDb();
    const { error } = await adminDb.auth.admin.deleteUser(userId, false);

    if (error) {
      throw toGatewayError("Failed to rollback authentication account", error);
    }
  },

  async createUserProfile({ accessToken, userId, payload }) {
    const db = getDb(accessToken);
    const { data, error } = await db
      .from(PROFILES_TABLE)
      .upsert(
        {
          user_id: userId,
          ...payload,
        },
        { onConflict: "user_id" },
      )
      .select("*")
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to create user profile", error);
    }

    return data;
  },

  async updateUserProfile({ accessToken, userId, payload }) {
    const db = getDb(accessToken);
    const { data, error } = await db
      .from(PROFILES_TABLE)
      .update(payload)
      .eq("user_id", userId)
      .select("*")
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to update user profile", error);
    }

    return data;
  },

  async banUser({ accessToken, actorId, userId, reason }) {
    const db = getDb(accessToken);
    const { error } = await db
      .from(BANNED_USERS_TABLE)
      .upsert(
        {
          user_id: userId,
          reason: reason || null,
          is_active: true,
          banned_at: new Date().toISOString(),
          banned_by_user_id: actorId,
          unbanned_at: null,
          unbanned_by_user_id: null,
        },
        { onConflict: "user_id" },
      );

    if (error) {
      throw toGatewayError("Failed to ban user", error);
    }
  },

  async unbanUser({ accessToken, actorId, userId }) {
    const db = getDb(accessToken);
    const { error } = await db
      .from(BANNED_USERS_TABLE)
      .update({
        is_active: false,
        unbanned_at: new Date().toISOString(),
        unbanned_by_user_id: actorId,
      })
      .eq("user_id", userId)
      .eq("is_active", true);

    if (error) {
      throw toGatewayError("Failed to unban user", error);
    }
  },

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
      .order("lname", { ascending: true })
      .order("fname", { ascending: true });

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

  async listDashboardReports({ actor, accessToken, startAt, endAt }) {
    const db = getDb(accessToken);

    let query = db
      .from(REPORTS_TABLE)
      .select("id, issue_type, status, created_at")
      .order("created_at", { ascending: false });

    query = applyDepartmentScope(query, actor);

    if (startAt) {
      query = query.gte("created_at", startAt);
    }

    if (endAt) {
      query = query.lt("created_at", endAt);
    }

    const { data, error } = await query;

    if (error) {
      throw toGatewayError("Failed to fetch dashboard report metrics", error);
    }

    return data || [];
  },

  async countTotalCitizens({ accessToken }) {
    const db = getDb(accessToken);

    const { count, error } = await db
      .from(PROFILES_TABLE)
      .select("user_id", { count: "exact", head: true })
      .eq("account_type", "citizen");

    if (error) {
      throw toGatewayError("Failed to count users", error);
    }

    return count || 0;
  },

  async listRecentCitizens({ accessToken, limit = 5 }) {
    const db = getDb(accessToken);
    const normalizedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 5;

    const { data, error } = await db
      .from(PROFILES_TABLE)
      .select("user_id, username, fname, mname, lname, email, created_at")
      .eq("account_type", "citizen")
      .order("created_at", { ascending: false })
      .range(0, Math.max(0, normalizedLimit - 1));

    if (error) {
      throw toGatewayError("Failed to fetch recent users", error);
    }

    return data || [];
  },

  async listRecentOfficeAdmins({ accessToken, limit = 20 }) {
    const db = getDb(accessToken);
    const normalizedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 20;

    const { data, error } = await db
      .from(PROFILES_TABLE)
      .select("*")
      .eq("account_type", "admin")
      .eq("role", USER_ROLES.OFFICE_ADMIN)
      .order("created_at", { ascending: false })
      .range(0, Math.max(0, normalizedLimit - 1));

    if (error) {
      throw toGatewayError("Failed to fetch recent admins", error);
    }

    return data || [];
  },
};
