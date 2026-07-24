import { LATEST_HOME_REPORT } from "../constants/homeData";
import { MY_REPORTS } from "../constants/myReportsData";
import { api } from "./api";
import { getAuthToken } from "./authSession";
import { runtimeFlags } from "./runtimeFlags";
import { getSupabaseClient } from "./supabase";
import { setCache, getCache } from "./cache";

const reportedFallbackWarnings = new Set();
const TEMP_TOKEN_PREFIX = "temp-";
const DEFAULT_HOME_REPORT_NAME = "You";

const STATUS_LABEL_MAP = {
  pending: "Pending",
  in_review: "In Progress",
  resolved: "Completed",
  rejected: "Unresolved",
};

function readArray(payload, key, fallback) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object" && Array.isArray(payload[key])) {
    return payload[key];
  }

  return fallback;
}

function isAuthError(error) {
  const status = error?.status;
  const message = String(error?.message || "").toLowerCase();
  return (
    status === 401 ||
    status === 403 ||
    message.includes("invalid") ||
    message.includes("expired") ||
    message.includes("unauthorized") ||
    message.includes("token")
  );
}

function warnFallbackOnce(label, error) {
  // Auth errors are handled automatically — no need to log them
  if (isAuthError(error)) return;

  const message = error?.message || String(error || "Unknown error");
  const dedupeKey = `${label}:${message}`;

  if (reportedFallbackWarnings.has(dedupeKey)) {
    return;
  }

  reportedFallbackWarnings.add(dedupeKey);
  console.warn(label, message);
}

function normalizeStatus(status) {
  const normalizedStatus = String(status || "")
    .trim()
    .toLowerCase();

  if (!normalizedStatus) {
    return "Pending";
  }

  return STATUS_LABEL_MAP[normalizedStatus] || "Pending";
}

function resolveAttachment(report) {
  const attachmentUrl =
    report?.attachmentUrl || report?.attachment_url || report?.attachment;

  if (typeof attachmentUrl !== "string" || !attachmentUrl.trim()) {
    return null;
  }

  return {
    kind: "image",
    source: attachmentUrl.trim(),
  };
}

function mapBackendReportToMyReport(report, index) {
  if (!report || typeof report !== "object") {
    return null;
  }

  return {
    id: report.id || `report-${index + 1}`,
    issueType: report.issueType || report.issue_type || "Unspecified Issue",
    location: report.location || "Unknown location",
    description: report.description || "No description provided.",
    createdAt:
      report.createdAt || report.created_at || new Date().toISOString(),
    status: normalizeStatus(report.status),
    attachment: resolveAttachment(report),
  };
}

function readReportsPayload(payload) {
  return readArray(payload, "data", readArray(payload, "reports", []));
}

function toMyReportsPayload(payload) {
  const reportRows = readReportsPayload(payload);

  if (!Array.isArray(reportRows) || reportRows.length === 0) {
    return [];
  }

  return reportRows
    .map(mapBackendReportToMyReport)
    .filter((report) => report !== null);
}

function formatRelativeTime(dateValue) {
  const parsedDate = new Date(dateValue);
  const dateMillis = parsedDate.getTime();

  if (Number.isNaN(dateMillis)) {
    return "Just now";
  }

  const elapsedMs = Date.now() - dateMillis;

  if (elapsedMs < 60_000) {
    return "Just now";
  }

  const elapsedMinutes = Math.floor(elapsedMs / 60_000);
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays}d ago`;
}

function toLatestHomeReport(report) {
  if (!report) {
    return null;
  }

  return {
    id: report.id,
    name: DEFAULT_HOME_REPORT_NAME,
    time: formatRelativeTime(report.createdAt),
    tags: ["Report"],
    message: report.description,
    location: report.location,
  };
}

function shouldUseLocalReportsData() {
  if (!runtimeFlags.allowLocalReportsFallback) {
    return false;
  }

  const token = getAuthToken();

  if (!token) {
    return true;
  }

  return token.startsWith(TEMP_TOKEN_PREFIX);
}

export const reportsApi = {
  uploadImage: async (imageUri) => {
    const supabase = getSupabaseClient();
    const fileName = `report_${Date.now()}_${Math.floor(Math.random() * 10000)}.jpg`;

    const response = await fetch(imageUri);
    const arrayBuffer = await response.arrayBuffer();

    const { error } = await supabase.storage
      .from("attachments")
      .upload(`public/${fileName}`, arrayBuffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: "image/jpeg",
      });

    if (error) {
      console.error("Upload error:", error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from("attachments")
      .getPublicUrl(`public/${fileName}`);

    return publicUrlData.publicUrl;
  },
  deleteReport: async (reportId) => {
    if (!reportId) throw new Error("Missing report ID");
    return api.delete(`/reports/${reportId}`);
  },
  updateReport: async (reportId, { issueType, location, latitude, longitude, description }) => {
    if (!reportId) throw new Error("Missing report ID");

    const payload = {};
    if (issueType) payload.issueType = issueType;
    if (location) payload.location = location;
    if (latitude !== undefined) payload.latitude = latitude;
    if (longitude !== undefined) payload.longitude = longitude;
    if (description) payload.description = description;

    return api.patch(`/reports/${reportId}`, payload);
  },
  createReport: async ({
    issueType,
    location,
    latitude,
    longitude,
    description,
    attachmentUrl,
  }) => {
    const payload = {
      issueType,
      location,
      latitude: latitude != null ? Number(latitude) : null,
      longitude: longitude != null ? Number(longitude) : null,
      description,
      ...(attachmentUrl &&
      typeof attachmentUrl === "string" &&
      attachmentUrl.startsWith("http")
        ? { attachmentUrl }
        : {}),
    };
    return api.post("/reports", payload);
  },
  getMyReports: async (limit = 10, offset = 0, statusFilter = "all") => {
    const cacheKey = `my_reports_${limit}_${offset}_${statusFilter}`;

    if (shouldUseLocalReportsData()) {
      return { data: MY_REPORTS, total: MY_REPORTS.length };
    }

    try {
      let query = `/reports?limit=${limit}&offset=${offset}`;
      if (statusFilter && statusFilter !== "all") {
        const backendStatus = {
          "pending": "pending",
          "in progress": "in_review",
          "completed": "resolved",
          "unresolved": "rejected",
        }[statusFilter.toLowerCase()] || statusFilter;
        query += `&status=${backendStatus}`;
      }

      const response = await api.get(query);
      const mappedReports = toMyReportsPayload(response);
      const total = response?.pagination?.total ?? response?.total ?? mappedReports.length;

      const result = { data: mappedReports, total };
      setCache(cacheKey, result, 300); // cache for 5 minutes
      return result;
    } catch (error) {
      warnFallbackOnce("Falling back to cached or local my reports data:", error);
      const cached = await getCache(cacheKey, { ignoreExpiry: true });
      if (cached) {
        return cached;
      }
      if (!runtimeFlags.allowLocalReportsFallback) {
        throw error;
      }
      return { data: MY_REPORTS, total: MY_REPORTS.length };
    }
  },

  getMyReportCounts: async () => {
    const cacheKey = "my_report_counts";

    if (shouldUseLocalReportsData()) {
      return {
        pending: MY_REPORTS.filter((r) => normalizeStatus(r.status) === "Pending").length,
        inProgress: MY_REPORTS.filter((r) => normalizeStatus(r.status) === "In Progress").length,
        completed: MY_REPORTS.filter((r) => normalizeStatus(r.status) === "Completed").length,
        unresolved: MY_REPORTS.filter((r) => normalizeStatus(r.status) === "Unresolved").length,
      };
    }

    try {
      const response = await api.get("/reports/counts");
      const counts = response.data || {};
      const result = {
        pending: counts.pending || 0,
        inProgress: counts.in_review || 0,
        completed: counts.resolved || 0,
        unresolved: counts.rejected || 0,
      };
      setCache(cacheKey, result, 300);
      return result;
    } catch (error) {
      warnFallbackOnce("Falling back to cached or local counts data:", error);
      const cached = await getCache(cacheKey, { ignoreExpiry: true });
      if (cached) {
        return cached;
      }
      return { pending: 0, inProgress: 0, completed: 0, unresolved: 0 };
    }
  },

  getLatestHomeReport: async () => {
    const cacheKey = "latest_home_report";

    if (shouldUseLocalReportsData()) {
      return LATEST_HOME_REPORT;
    }

    try {
      const response = await api.get("/reports?limit=1&offset=0");
      const latestReport = toMyReportsPayload(response)[0] || null;
      const mappedLatestHomeReport = toLatestHomeReport(latestReport);
      const result = mappedLatestHomeReport || LATEST_HOME_REPORT;
      setCache(cacheKey, result, 300);
      return result;
    } catch (error) {
      warnFallbackOnce("Falling back to cached or local home report data:", error);
      const cached = await getCache(cacheKey, { ignoreExpiry: true });
      if (cached) {
        return cached;
      }
      if (!runtimeFlags.allowLocalReportsFallback) {
        throw error;
      }
      return LATEST_HOME_REPORT;
    }
  },
};
