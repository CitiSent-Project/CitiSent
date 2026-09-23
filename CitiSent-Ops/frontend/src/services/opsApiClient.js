import { supabase } from "./supabaseClient.js";

const OPS_API_BASE_URL = import.meta.env.VITE_OPS_API_URL || "http://localhost:5001/api/v1/ops";

async function request(endpoint, options = {}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${OPS_API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = body?.details
      ? `${body.error} (${typeof body.details === "string" ? body.details : JSON.stringify(body.details)})`
      : body?.error || `HTTP ${response.status}: ${response.statusText}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.details = body?.details;
    throw err;
  }

  return body;
}

export const opsApiClient = {
  // First-Time Developer Registration
  registerDeveloper: (credentials) =>
    request("/register-dev", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  getMe: () => request("/me"),
  
  // Department Seeding
  getDepartmentPresets: () => request("/departments/preview"),
  seedDepartments: (departments) =>
    request("/departments/seed", {
      method: "POST",
      body: JSON.stringify({ departments }),
    }),

  // Superadmin Management
  getSuperadmins: () => request("/superadmins"),
  provisionSuperadmin: (data) =>
    request("/superadmins", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  resendInvite: (id) =>
    request(`/superadmins/${id}/resend-invite`, {
      method: "POST",
    }),
  unlockAccount: (id) =>
    request(`/superadmins/${id}/unlock`, {
      method: "POST",
    }),
  toggleStatus: (id, status) =>
    request(`/superadmins/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),

  // Audit Logs
  getAuditLogs: () => request("/audit-logs"),
};
