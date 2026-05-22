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
const AGENCY_LOGOS_BUCKET = "agency-logos";
const LOGO_SIGNED_URL_TTL_SECONDS = 24 * 60 * 60;
const AGENCY_SELECT_COLUMNS =
  "id, slug, name, description, is_active, logo_path, created_at, updated_at";

function getDb(accessToken) {
  return createAdminSupabaseClient() || createUserSupabaseClient(accessToken) || supabase;
}

function getAdminDb(accessToken) {
  return createAdminSupabaseClient() || createUserSupabaseClient(accessToken) || supabase;
}

function getStorageDb(accessToken) {
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

function buildMatchValues({ slug, name }) {
  const values = [slug, name]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return [...new Set(values)];
}

function mapAgencyRow(row = {}) {
  return {
    id: String(row.slug || "").trim(),
    agencyId: String(row.id || "").trim(),
    label: String(row.name || "").trim(),
    slug: String(row.slug || "").trim(),
    name: String(row.name || "").trim(),
    description: String(row.description || "").trim(),
    isActive: Boolean(row.is_active),
    logoPath: String(row.logo_path || "").trim() || null,
    logoUrl: null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

async function attachSignedLogoUrl({ accessToken, department }) {
  if (!department?.logoPath) {
    return department;
  }

  const db = getStorageDb(accessToken);
  const { data, error } = await db.storage
    .from(AGENCY_LOGOS_BUCKET)
    .createSignedUrl(department.logoPath, LOGO_SIGNED_URL_TTL_SECONDS);

  if (error) {
    return department;
  }

  return {
    ...department,
    logoUrl: data?.signedUrl || null,
  };
}

async function attachSignedLogoUrls({ accessToken, departments }) {
  return Promise.all(
    departments.map((department) => attachSignedLogoUrl({ accessToken, department })),
  );
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

async function updateByColumn({ db, table, column, values, payload }) {
  if (!values.length) {
    return;
  }

  const { error } = await db
    .from(table)
    .update(payload)
    .in(column, values);

  if (error) {
    throw toGatewayError("Failed to update department references", error);
  }
}

async function deleteByColumn({ db, table, column, values }) {
  if (!values.length) {
    return;
  }

  const { error } = await db
    .from(table)
    .delete()
    .in(column, values);

  if (error) {
    throw toGatewayError("Failed to delete department references", error);
  }
}

export const departmentsRepository = {
  async listDepartments({ accessToken, includeInactive = false } = {}) {
    const db = getDb(accessToken);

    let query = db
      .from(AGENCIES_TABLE)
      .select(AGENCY_SELECT_COLUMNS)
      .order("name", { ascending: true });

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      throw toGatewayError("Failed to fetch departments", error);
    }

    return attachSignedLogoUrls({
      accessToken,
      departments: (data || []).map(mapAgencyRow),
    });
  },

  async getDepartmentBySlug({ accessToken, slug }) {
    const normalizedSlug = String(slug || "").trim();
    if (!normalizedSlug) {
      return null;
    }

    const db = getDb(accessToken);
    const { data, error } = await db
      .from(AGENCIES_TABLE)
      .select(AGENCY_SELECT_COLUMNS)
      .eq("slug", normalizedSlug)
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to fetch department", error);
    }

    return data
      ? attachSignedLogoUrl({ accessToken, department: mapAgencyRow(data) })
      : null;
  },

  async findBySlugOrName({ accessToken, value, includeInactive = true }) {
    const normalizedValue = String(value || "").trim();
    if (!normalizedValue) {
      return null;
    }

    const db = getDb(accessToken);
    const { data, error } = await db
      .from(AGENCIES_TABLE)
      .select(AGENCY_SELECT_COLUMNS)
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

    return attachSignedLogoUrl({ accessToken, department: match });
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
      .select(AGENCY_SELECT_COLUMNS)
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to create department", error);
    }

    return data
      ? attachSignedLogoUrl({ accessToken, department: mapAgencyRow(data) })
      : null;
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
      .select(AGENCY_SELECT_COLUMNS)
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to update department", error);
    }

    return data
      ? attachSignedLogoUrl({ accessToken, department: mapAgencyRow(data) })
      : null;
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
      .select(AGENCY_SELECT_COLUMNS)
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to update department status", error);
    }

    return data
      ? attachSignedLogoUrl({ accessToken, department: mapAgencyRow(data) })
      : null;
  },

  async updateDepartmentLogoPath({ accessToken, slug, logoPath }) {
    const normalizedSlug = String(slug || "").trim();
    if (!normalizedSlug) {
      return null;
    }

    const db = getDb(accessToken);
    const { data, error } = await db
      .from(AGENCIES_TABLE)
      .update({
        logo_path: logoPath || null,
      })
      .eq("slug", normalizedSlug)
      .select(AGENCY_SELECT_COLUMNS)
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to update department logo", error);
    }

    return data
      ? attachSignedLogoUrl({ accessToken, department: mapAgencyRow(data) })
      : null;
  },

  async uploadLogoObject({ accessToken, path, buffer, contentType }) {
    const db = getStorageDb(accessToken);
    const { data, error } = await db.storage
      .from(AGENCY_LOGOS_BUCKET)
      .upload(path, buffer, {
        contentType,
        cacheControl: "86400",
        upsert: true,
      });

    if (error) {
      throw toGatewayError("Failed to upload department logo", error);
    }

    return data;
  },

  async removeLogoObject({ accessToken, path }) {
    const normalizedPath = String(path || "").trim();
    if (!normalizedPath) {
      return;
    }

    const db = getStorageDb(accessToken);
    const { error } = await db.storage
      .from(AGENCY_LOGOS_BUCKET)
      .remove([normalizedPath]);

    if (error) {
      throw toGatewayError("Failed to delete department logo", error);
    }
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

  async reassignDepartmentReferences({ accessToken, fromSlug, fromName, toSlug, toName }) {
    const db = getAdminDb(accessToken);
    const values = buildMatchValues({ slug: fromSlug, name: fromName });

    await Promise.all([
      updateByColumn({
        db,
        table: PROFILES_TABLE,
        column: "department_id",
        values,
        payload: {
          department_id: toSlug,
          department_label: toName,
        },
      }),
      updateByColumn({
        db,
        table: PROFILES_TABLE,
        column: "department_label",
        values,
        payload: {
          department_id: toSlug,
          department_label: toName,
        },
      }),
      updateByColumn({
        db,
        table: REPORTS_TABLE,
        column: "issue_type",
        values,
        payload: {
          issue_type: toSlug,
        },
      }),
      updateByColumn({
        db,
        table: TRANSFER_REQUESTS_TABLE,
        column: "current_department_id",
        values,
        payload: {
          current_department_id: toSlug,
          current_department_label: toName,
        },
      }),
      updateByColumn({
        db,
        table: TRANSFER_REQUESTS_TABLE,
        column: "current_department_label",
        values,
        payload: {
          current_department_id: toSlug,
          current_department_label: toName,
        },
      }),
      updateByColumn({
        db,
        table: TRANSFER_REQUESTS_TABLE,
        column: "requested_department_id",
        values,
        payload: {
          requested_department_id: toSlug,
          requested_department_label: toName,
        },
      }),
      updateByColumn({
        db,
        table: TRANSFER_REQUESTS_TABLE,
        column: "requested_department_label",
        values,
        payload: {
          requested_department_id: toSlug,
          requested_department_label: toName,
        },
      }),
    ]);
  },

  async cleanupDepartmentReferences({ accessToken, slug, name }) {
    const db = getAdminDb(accessToken);
    const values = buildMatchValues({ slug, name });

    await Promise.all([
      deleteByColumn({
        db,
        table: REPORTS_TABLE,
        column: "issue_type",
        values,
      }),
      updateByColumn({
        db,
        table: PROFILES_TABLE,
        column: "department_id",
        values,
        payload: {
          department_id: null,
          department_label: null,
        },
      }),
      updateByColumn({
        db,
        table: PROFILES_TABLE,
        column: "department_label",
        values,
        payload: {
          department_id: null,
          department_label: null,
        },
      }),
      updateByColumn({
        db,
        table: TRANSFER_REQUESTS_TABLE,
        column: "current_department_id",
        values,
        payload: {
          current_department_id: null,
          current_department_label: null,
        },
      }),
      updateByColumn({
        db,
        table: TRANSFER_REQUESTS_TABLE,
        column: "current_department_label",
        values,
        payload: {
          current_department_id: null,
          current_department_label: null,
        },
      }),
      updateByColumn({
        db,
        table: TRANSFER_REQUESTS_TABLE,
        column: "requested_department_id",
        values,
        payload: {
          requested_department_id: null,
          requested_department_label: null,
        },
      }),
      updateByColumn({
        db,
        table: TRANSFER_REQUESTS_TABLE,
        column: "requested_department_label",
        values,
        payload: {
          requested_department_id: null,
          requested_department_label: null,
        },
      }),
    ]);
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
      .select(AGENCY_SELECT_COLUMNS)
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to delete department", error);
    }

    return data ? mapAgencyRow(data) : null;
  },
};
