import { StatusCodes } from "http-status-codes";
import {
  createAdminSupabaseClient,
  createUserSupabaseClient,
  supabase,
} from "../../config/supabase.js";
import { AppError } from "../../shared/errors/appError.js";

const AGENCIES_TABLE = "agencies";
const PROFILES_TABLE = "profiles";
const REPORTS_TABLE = "reports";
const TRANSFER_REQUESTS_TABLE = "transfer_requests";

function getDb(accessToken) {
  return createAdminSupabaseClient() || createUserSupabaseClient(accessToken) || supabase;
}

function toGatewayError(message, details) {
  return new AppError(message, StatusCodes.BAD_GATEWAY, details);
}

function normalizeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function mapAgencyRow(row = {}) {
  return {
    id: String(row.slug || "").trim(),
    label: String(row.name || "").trim(),
    slug: String(row.slug || "").trim(),
    name: String(row.name || "").trim(),
    description: String(row.description || "").trim(),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

async function countByColumn({ db, table, column, value }) {
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue) {
    return 0;
  }

  const { count, error } = await db
    .from(table)
    .select(column, { count: "exact", head: true })
    .eq(column, normalizedValue);

  if (error) {
    throw toGatewayError("Failed to verify department references", error);
  }

  return Number(count || 0);
}

export const departmentsRepository = {
  async listDepartments({ accessToken, includeInactive = false } = {}) {
    const db = getDb(accessToken);

    let query = db
      .from(AGENCIES_TABLE)
      .select("slug, name, description, is_active, created_at, updated_at")
      .order("name", { ascending: true });

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      throw toGatewayError("Failed to fetch departments", error);
    }

    return (data || []).map(mapAgencyRow);
  },

  async getDepartmentBySlug({ accessToken, slug }) {
    const normalizedSlug = String(slug || "").trim();
    if (!normalizedSlug) {
      return null;
    }

    const db = getDb(accessToken);
    const { data, error } = await db
      .from(AGENCIES_TABLE)
      .select("slug, name, description, is_active, created_at, updated_at")
      .eq("slug", normalizedSlug)
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to fetch department", error);
    }

    return data ? mapAgencyRow(data) : null;
  },

  async findBySlugOrName({ accessToken, value, includeInactive = true }) {
    const normalizedValue = String(value || "").trim();
    if (!normalizedValue) {
      return null;
    }

    const db = getDb(accessToken);
    const { data, error } = await db
      .from(AGENCIES_TABLE)
      .select("slug, name, description, is_active, created_at, updated_at")
      .or(`slug.eq.${normalizedValue},name.eq.${normalizedValue}`)
      .order("created_at", { ascending: true });

    if (error) {
      throw toGatewayError("Failed to resolve department", error);
    }

    const rows = (data || []).map(mapAgencyRow);
    const exactSlugMatch = rows.find(
      (row) => normalizeValue(row.slug) === normalizeValue(normalizedValue),
    );
    const exactNameMatch = rows.find(
      (row) => normalizeValue(row.name) === normalizeValue(normalizedValue),
    );

    const match = exactSlugMatch || exactNameMatch || null;
    if (!match) {
      return null;
    }

    if (!includeInactive && !match.isActive) {
      return null;
    }

    return match;
  },

  async createDepartment({ accessToken, payload }) {
    const db = getDb(accessToken);
    const { data, error } = await db
      .from(AGENCIES_TABLE)
      .insert({
        slug: payload.slug,
        name: payload.name,
        description: payload.description || null,
        is_active: true,
      })
      .select("slug, name, description, is_active, created_at, updated_at")
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to create department", error);
    }

    return data ? mapAgencyRow(data) : null;
  },

  async updateDepartmentBySlug({ accessToken, slug, payload }) {
    const normalizedSlug = String(slug || "").trim();
    if (!normalizedSlug) {
      return null;
    }

    const db = getDb(accessToken);
    const { data, error } = await db
      .from(AGENCIES_TABLE)
      .update({
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.description !== undefined
          ? { description: payload.description || null }
          : {}),
      })
      .eq("slug", normalizedSlug)
      .select("slug, name, description, is_active, created_at, updated_at")
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to update department", error);
    }

    return data ? mapAgencyRow(data) : null;
  },

  async setDepartmentActive({ accessToken, slug, isActive }) {
    const normalizedSlug = String(slug || "").trim();
    if (!normalizedSlug) {
      return null;
    }

    const db = getDb(accessToken);
    const { data, error } = await db
      .from(AGENCIES_TABLE)
      .update({
        is_active: Boolean(isActive),
      })
      .eq("slug", normalizedSlug)
      .select("slug, name, description, is_active, created_at, updated_at")
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to update department status", error);
    }

    return data ? mapAgencyRow(data) : null;
  },

  async countDepartmentReferences({ accessToken, slug, name }) {
    const db = getDb(accessToken);

    const [
      profilesById,
      profilesByLabel,
      reportsByIssueTypeSlug,
      reportsByIssueTypeLabel,
      transferCurrentId,
      transferCurrentLabel,
      transferRequestedId,
      transferRequestedLabel,
    ] = await Promise.all([
      countByColumn({ db, table: PROFILES_TABLE, column: "department_id", value: slug }),
      countByColumn({ db, table: PROFILES_TABLE, column: "department_label", value: name }),
      countByColumn({ db, table: REPORTS_TABLE, column: "issue_type", value: slug }),
      countByColumn({ db, table: REPORTS_TABLE, column: "issue_type", value: name }),
      countByColumn({
        db,
        table: TRANSFER_REQUESTS_TABLE,
        column: "current_department_id",
        value: slug,
      }),
      countByColumn({
        db,
        table: TRANSFER_REQUESTS_TABLE,
        column: "current_department_label",
        value: name,
      }),
      countByColumn({
        db,
        table: TRANSFER_REQUESTS_TABLE,
        column: "requested_department_id",
        value: slug,
      }),
      countByColumn({
        db,
        table: TRANSFER_REQUESTS_TABLE,
        column: "requested_department_label",
        value: name,
      }),
    ]);

    const breakdown = {
      profiles: profilesById + profilesByLabel,
      reports: reportsByIssueTypeSlug + reportsByIssueTypeLabel,
      transferRequests:
        transferCurrentId +
        transferCurrentLabel +
        transferRequestedId +
        transferRequestedLabel,
    };

    return {
      total: breakdown.profiles + breakdown.reports + breakdown.transferRequests,
      breakdown,
    };
  },

  async deleteDepartmentBySlug({ accessToken, slug }) {
    const normalizedSlug = String(slug || "").trim();
    if (!normalizedSlug) {
      return null;
    }

    const db = getDb(accessToken);
    const { data, error } = await db
      .from(AGENCIES_TABLE)
      .delete()
      .eq("slug", normalizedSlug)
      .select("slug, name, description, is_active, created_at, updated_at")
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to delete department", error);
    }

    return data ? mapAgencyRow(data) : null;
  },
};
