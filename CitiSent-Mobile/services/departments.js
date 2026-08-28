import { api } from "./api";
import { getCache, setCache } from "./cache";

const DEPARTMENTS_CACHE_KEY = "departments_list";
const DEPARTMENTS_CACHE_TTL = 3600; // 1 hour
let memoryDepartments = null;

function readDepartmentsPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.departments)) {
      return payload.departments;
    }

    if (Array.isArray(payload.data)) {
      return payload.data;
    }
  }

  return [];
}

function normalizeDepartment(row = {}) {
  const slug = String(row.slug || row.id || "").trim();
  const name = String(row.name || row.label || "").trim();

  if (!slug || !name) {
    return null;
  }

  return {
    id: slug,
    slug,
    label: name,
    name,
    description: String(row.description || "").trim(),
    isActive: row.isActive !== false,
    logoPath: row.logoPath || row.logo_path || null,
    logoUrl: row.logoUrl || row.logo_url || null,
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null,
  };
}

function normalizeDepartments(rows) {
  const seen = new Set();

  return (Array.isArray(rows) ? rows : [])
    .map(normalizeDepartment)
    .filter((department) => department !== null)
    .filter((department) => {
      if (seen.has(department.slug)) {
        return false;
      }

      seen.add(department.slug);
      return true;
    });
}

export const departmentsApi = {
  getDepartments: async () => {
    if (Array.isArray(memoryDepartments) && memoryDepartments.length > 0) {
      return memoryDepartments;
    }

    try {
      const cached = await getCache(DEPARTMENTS_CACHE_KEY);
      if (Array.isArray(cached) && cached.length > 0) {
        memoryDepartments = cached;
        return cached;
      }
    } catch {}

    try {
      const response = await api.get("/departments");
      const normalized = normalizeDepartments(readDepartmentsPayload(response));
      memoryDepartments = normalized;
      await setCache(DEPARTMENTS_CACHE_KEY, normalized, DEPARTMENTS_CACHE_TTL);
      return normalized;
    } catch (err) {
      const stale = await getCache(DEPARTMENTS_CACHE_KEY, { ignoreExpiry: true });
      if (Array.isArray(stale) && stale.length > 0) {
        memoryDepartments = stale;
        return stale;
      }
      return [];
    }
  },
};

