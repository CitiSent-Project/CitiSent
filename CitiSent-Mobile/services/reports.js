import { LATEST_HOME_REPORT } from "../constants/homeData";
import { MY_REPORTS } from "../constants/myReportsData";
import { api } from "./api";
import { getAuthToken } from "./authSession";
import { runtimeFlags } from "./runtimeFlags";

const reportedFallbackWarnings = new Set();
const TEMP_TOKEN_PREFIX = "temp-";
const DEFAULT_HOME_REPORT_NAME = "You";

const STATUS_LABEL_MAP = {
  pending: "Pending",
  in_review: "In Progress",
  resolved: "Completed",
  rejected: "Completed",
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

function warnFallbackOnce(label, error) {
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
  getMyReports: async () => {
    if (shouldUseLocalReportsData()) {
      return MY_REPORTS;
    }

    try {
      const response = await api.get("/reports?limit=50&offset=0");
      const mappedReports = toMyReportsPayload(response);

      return mappedReports.length ? mappedReports : MY_REPORTS;
    } catch (error) {
      warnFallbackOnce("Falling back to local my reports data:", error);
      if (!runtimeFlags.allowLocalReportsFallback) {
        throw error;
      }
      return MY_REPORTS;
    }
  },

  getLatestHomeReport: async () => {
    if (shouldUseLocalReportsData()) {
      return LATEST_HOME_REPORT;
    }

    try {
      const response = await api.get("/reports?limit=1&offset=0");
      const latestReport = toMyReportsPayload(response)[0] || null;
      const mappedLatestHomeReport = toLatestHomeReport(latestReport);

      return mappedLatestHomeReport || LATEST_HOME_REPORT;
    } catch (error) {
      warnFallbackOnce("Falling back to local home report data:", error);
      if (!runtimeFlags.allowLocalReportsFallback) {
        throw error;
      }
      return LATEST_HOME_REPORT;
    }
  },
};
