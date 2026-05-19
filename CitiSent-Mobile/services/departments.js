import { api } from "./api";

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
    const response = await api.get("/departments");
    return normalizeDepartments(readDepartmentsPayload(response));
  },
};
