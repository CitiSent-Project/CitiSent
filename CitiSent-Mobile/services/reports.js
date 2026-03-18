import { LATEST_HOME_REPORT } from "../constants/homeData";
import { MY_REPORTS } from "../constants/myReportsData";
import { api } from "./api";

const reportedFallbackWarnings = new Set();

function readArray(payload, key, fallback) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object" && Array.isArray(payload[key])) {
    return payload[key];
  }

  return fallback;
}

function readObject(payload, key, fallback) {
  if (payload && typeof payload === "object") {
    if (payload[key] && typeof payload[key] === "object") {
      return payload[key];
    }

    return payload;
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

export const reportsApi = {
  getMyReports: async () => {
    try {
      const response = await api.get("/reports/mine");
      return readArray(response, "reports", MY_REPORTS);
    } catch (error) {
      warnFallbackOnce("Falling back to local my reports data:", error);
      return MY_REPORTS;
    }
  },

  getLatestHomeReport: async () => {
    try {
      const response = await api.get("/reports/latest");
      return readObject(response, "report", LATEST_HOME_REPORT);
    } catch (error) {
      warnFallbackOnce("Falling back to local home report data:", error);
      return LATEST_HOME_REPORT;
    }
  },
};
