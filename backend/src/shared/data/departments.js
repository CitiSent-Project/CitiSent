export const DEPARTMENTS = Object.freeze([
  {
    id: "bplo",
    label: "Business Permits and Licensing Office (BPLO)",
  },
  {
    id: "cto",
    label: "City Treasury Office",
  },
  {
    id: "bfp",
    label: "Bureau of Fire Protection (BFP) Processing Area",
  },
  {
    id: "ctmd",
    label: "City Traffic Management Division/Impounding Services",
  },
  {
    id: "cvo",
    label: "City Veterinary Office",
  },
  {
    id: "cao",
    label: "City Agriculture Office",
  },
  {
    id: "ccdo",
    label: "City Cooperative Development Office",
  },
  {
    id: "peso",
    label: "Public Employment Service Office (PESO)",
  },
  {
    id: "pwd",
    label: "Senior Citizens / PWD Accessibility Services",
  },
]);

function normalizeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function getDepartmentById(departmentId) {
  const normalizedId = normalizeValue(departmentId);
  return (
    DEPARTMENTS.find(
      (department) => normalizeValue(department.id) === normalizedId,
    ) || null
  );
}

export function getDepartmentByLabel(label) {
  const normalizedLabel = normalizeValue(label);
  return (
    DEPARTMENTS.find(
      (department) => normalizeValue(department.label) === normalizedLabel,
    ) || null
  );
}

export function resolveDepartment(value) {
  return getDepartmentById(value) || getDepartmentByLabel(value) || null;
}

export function resolveDepartmentId(value) {
  return resolveDepartment(value)?.id || "";
}

export function resolveDepartmentLabel(value) {
  const match = resolveDepartment(value);
  return match?.label || String(value || "").trim();
}

export function buildDepartmentCandidates({ departmentId, departmentLabel }) {
  const values = [
    String(departmentId || "").trim(),
    String(departmentLabel || "").trim(),
    resolveDepartmentId(departmentLabel),
    resolveDepartmentLabel(departmentId),
  ].filter(Boolean);

  return Array.from(new Set(values));
}
